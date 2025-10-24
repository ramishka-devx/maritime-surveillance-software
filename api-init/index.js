import express from 'express'
import dotenv from 'dotenv'
import WebSocket from 'ws'

dotenv.config()

const app = express()

// Config
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())

// Routes
app.get('/', (req, res) => {
	res.send('Maritime Surveillance API - healthy')
})

// In-memory store for recent AIS messages
const AIS_STORE_LIMIT = 200
const aisMessages = []

// SSE clients
const sseClients = new Set()

function pushAisMessage(msg) {
	// keep store bounded
	aisMessages.push(msg)
	if (aisMessages.length > AIS_STORE_LIMIT) aisMessages.shift()

	// broadcast to SSE clients
	const payload = `data: ${JSON.stringify(msg)}\n\n`
	for (const res of sseClients) {
		try {
			res.write(payload)
		} catch (err) {
			// client likely disconnected, remove later
			sseClients.delete(res)
		}
	}
}

app.get('/api/status', (req, res) => {
	res.json({
		status: 'ok',
		uptime: process.uptime(),
		timestamp: Date.now()
	})
})

app.post('/api/echo', (req, res) => {
	res.json({received: req.body})
})

// AIS endpoints
app.get('/api/ais/latest', (req, res) => {
	res.json({count: aisMessages.length, messages: aisMessages.slice(-50)})
})

// Server-Sent Events endpoint to stream AIS messages in real-time
app.get('/api/ais/events', (req, res) => {
	res.setHeader('Content-Type', 'text/event-stream')
	res.setHeader('Cache-Control', 'no-cache')
	res.setHeader('Connection', 'keep-alive')
	res.flushHeaders && res.flushHeaders()

	// send a comment to keep the connection alive
	res.write(': connected\n\n')

	sseClients.add(res)

	// send last few messages immediately
	const recent = aisMessages.slice(-10)
	for (const m of recent) res.write(`data: ${JSON.stringify(m)}\n\n`)

	req.on('close', () => {
		sseClients.delete(res)
	})
})

// AIS websocket client
let aisSocket = null
let reconnectTimeout = 1000

function initAisClient() {
	const apiKey = process.env.AIS_STREAM_IO_API_KEY
	if (!apiKey) {
		console.warn('AIS_API_KEY not set — AIS stream will not be started. Set AIS_API_KEY in your environment to enable.')
		return
	}

	const url = 'wss://stream.aisstream.io/v0/stream'
	console.log('Connecting to AIS stream...')
	aisSocket = new WebSocket(url)

	aisSocket.onopen = () => {
		console.log('AIS websocket open — sending subscription')

		const subscription = {
			Apikey: apiKey,
			BoundingBoxes: [[[-90, -180], [90, 180]]]
		}

		// optional filters from env
		if (process.env.AIS_FILTERS) {
			subscription.FiltersShipMMSI = process.env.AIS_FILTERS.split(',').map(s => s.trim()).filter(Boolean)
		}
		if (process.env.AIS_MESSAGE_TYPES) {
			subscription.FilterMessageTypes = process.env.AIS_MESSAGE_TYPES.split(',').map(s => s.trim()).filter(Boolean)
		}

		try {
			aisSocket.send(JSON.stringify(subscription))
		} catch (err) {
			console.error('Failed to send subscription message', err)
		}
	}

	// 'ws' provides message as Buffer or string. Normalize and parse JSON when possible.
	aisSocket.on('message', (raw) => {
		try {
			let text
			if (typeof raw === 'string') text = raw
			else if (raw instanceof Buffer || raw instanceof Uint8Array) text = raw.toString('utf8')
			else text = String(raw)

			let parsed
			try {
				parsed = JSON.parse(text)
			} catch (e) {
				// Not JSON — keep raw text available
				parsed = { raw: text }
			}

			// push into memory and broadcast
			pushAisMessage(parsed)

			// compute a robust, human-friendly summary for logging
			let summary
			if (parsed === null || parsed === undefined) {
				summary = '(null)'
			} else if (typeof parsed === 'string') {
				summary = parsed.slice(0, 200)
			} else if (Array.isArray(parsed)) {
				summary = `Array[${parsed.length}]`
			} else if (typeof parsed === 'object') {
				// common shapes from AIS stream
				if (parsed.Message) {
					const m = parsed.Message
					if (m.Type) summary = `Type:${m.Type}`
					else if (m.PositionReport && m.PositionReport.MMSI) summary = `MMSI:${m.PositionReport.MMSI}`
					else summary = `Message keys: ${Object.keys(m).slice(0,5).join(',')}`
				} else {
					const keys = Object.keys(parsed)
					summary = keys.length ? `keys:${keys.slice(0,5).join(',')}` : JSON.stringify(parsed).slice(0,200)
				}
			} else {
				summary = String(parsed).slice(0,200)
			}

			console.log('AIS message received:', summary)
		} catch (err) {
			console.error('Error handling AIS message', err)
		}
	})

	aisSocket.onclose = (ev) => {
		console.warn('AIS websocket closed', ev && ev.code)
		aisSocket = null
		// reconnect with backoff
		setTimeout(() => {
			reconnectTimeout = Math.min(30000, reconnectTimeout * 1.5)
			initAisClient()
		}, reconnectTimeout)
	}

	aisSocket.onerror = (err) => {
		console.error('AIS websocket error', err && err.message)
		try { aisSocket.close() } catch (e) {}
	}
}

// Start AIS client unless disabled
initAisClient()

// 404 handler
app.use((req, res) => {
	res.status(404).json({error: 'Not Found'})
})

// Error handler
app.use((err, req, res, next) => {
	console.error(err)
	res.status(500).json({error: 'Internal Server Error', message: err?.message})
})

// Start server unless running in test mode
if (process.env.NODE_ENV !== 'test') {
	app.listen(PORT, () => {
		console.log(`Server listening on port ${PORT}`)
	})
}

export default app