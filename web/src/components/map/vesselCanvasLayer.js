import L from 'leaflet';

// Vessels drawn on one Leaflet canvas instead of one DOM element each, so thousands of them
// pan/zoom smoothly and a poll only redraws the canvas instead of mounting/unmounting DOM.

/**
 * Classifies vessel type into one of the 5 standard categories
 */
export function getVesselCategory(vessel) {
  if (!vessel) return 'special';
  // Live vessels carry the AIS "type of ship and cargo" code (ITU-R M.1371).
  const code = Number(vessel.shipType);
  if (vessel.shipType != null && Number.isInteger(code)) {
    if (code === 30) return 'fishing';
    if (code >= 60 && code <= 69) return 'passenger';
    if (code >= 70 && code <= 79) return 'cargo';
    if (code >= 80 && code <= 89) return 'tanker';
    return 'special';
  }
  // Reference fleet: free-text type.
  const typeStr = (vessel.type || '').toLowerCase();
  if (typeStr.includes('tanker') || typeStr.includes('hazmat') || typeStr.includes('oil')) {
    return 'tanker';
  }
  if (
    typeStr.includes('cargo') ||
    typeStr.includes('container') ||
    typeStr.includes('carrier') ||
    typeStr.includes('bulk')
  ) {
    return 'cargo';
  }
  if (typeStr.includes('passenger') || typeStr.includes('ferry') || typeStr.includes('cruise')) {
    return 'passenger';
  }
  if (typeStr.includes('fish') || typeStr.includes('trawl')) {
    return 'fishing';
  }
  return 'special';
}

/**
 * Normalizes vessel threat classification
 */
export function getVesselThreat(vessel) {
  if (!vessel) return 'normal';
  const threat = (vessel.threatLevel || vessel.threat_level || '').toUpperCase();
  if (threat === 'CRITICAL') return 'critical';
  if (threat === 'WARNING') return 'warning';
  return 'normal';
}

// Map colours. Alerted vessels are always magenta (with a dashed box), whatever their type,
// so they stand out; normal traffic is coloured by type. Muted press-ink hues that read on
// the light chart and stay clear of the alert magenta and the selection cyan.
const PAPER = '#f3f2f2';
const ALERT_COLORS = {
  critical: '#d6006c',
  warning: '#ff458e',
};
export const VESSEL_TYPES = [
  { id: 'cargo', label: 'Cargo', color: '#2f5d8a' },
  { id: 'tanker', label: 'Tanker', color: '#b35c00' },
  { id: 'passenger', label: 'Passenger', color: '#6a4c9c' },
  { id: 'fishing', label: 'Fishing', color: '#2e7d4f' },
  { id: 'special', label: 'Tug & other', color: '#201e1d' },
];
const TYPE_COLORS = Object.fromEntries(VESSEL_TYPES.map((t) => [t.id, t.color]));
const LABEL_INK = '#aa0b56';

export function vesselColor(vessel) {
  const threat = getVesselThreat(vessel);
  return ALERT_COLORS[threat] || TYPE_COLORS[getVesselCategory(vessel)];
}

export function isAlertVessel(vessel) {
  return getVesselThreat(vessel) !== 'normal';
}

export function vesselHeading(vessel) {
  return vessel.heading || vessel.cog || vessel.course || 0;
}

// The design's 16px arrowhead (M8 1 L13.5 14.5 L8 11.2 L2.5 14.5 Z), centred on the position.
const ARROW = [
  [0, -7],
  [5.5, 6.5],
  [0, 3.2],
  [-5.5, 6.5],
];

L.Canvas.include({
  // Mirrors L.Canvas#_updateCircle, but traces a rotated arrow instead of a circle. Alerted
  // vessels also get a dashed box and their name, like the chart in the design.
  _updateVesselArrow(layer) {
    if (!this._drawing || layer._empty()) return;

    const { x, y } = layer._point;
    const ctx = this._ctx;
    const { heading = 0, alert, label } = layer.options;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((heading * Math.PI) / 180);
    ctx.beginPath();
    ARROW.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.restore(); // the path survives restore; stroke width stays in screen pixels
    ctx.lineJoin = 'round';
    this._fillStroke(ctx, layer);

    if (alert) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = layer.options.fillColor;
      ctx.strokeRect(x - 14, y - 14, 28, 28);
      if (label) {
        ctx.setLineDash([]);
        ctx.font = 'italic 600 12px Inter, system-ui, sans-serif';
        ctx.lineWidth = 3;
        ctx.strokeStyle = PAPER;
        ctx.strokeText(label, x + 20, y + 4);
        ctx.fillStyle = LABEL_INK;
        ctx.fillText(label, x + 20, y + 4);
      }
      ctx.restore();
    }
  },
});

// CircleMarker gives us canvas hit-testing (by radius), click events and setLatLng redraws;
// only the drawing is replaced. Must be used with a canvas renderer.
const VesselArrow = L.CircleMarker.extend({
  _updatePath() {
    this._renderer._updateVesselArrow(this);
  },
  // The canvas only clears and repaints a layer's pixel bounds, so they must cover the alert
  // box and label too, or a moved vessel leaves its old label behind.
  // ponytail: fixed 220px label allowance; measure the text if names get longer.
  _updateBounds() {
    L.CircleMarker.prototype._updateBounds.call(this);
    if (this.options.alert) {
      const p = this._point;
      this._pxBounds = L.bounds(p.subtract([16, 16]), p.add([this.options.label ? 220 : 16, 16]));
    }
  },
});

/**
 * Creates the canvas state for a map: one renderer, one layer group, MMSI -> layer index.
 */
export function createVesselCanvas(map) {
  const renderer = L.canvas({ padding: 0.5 });
  const group = L.layerGroup().addTo(map);
  return {
    layers: new Map(),
    renderer,
    group,
    remove() {
      group.remove();
      map.removeLayer(renderer);
    },
  };
}

/**
 * Reconciles the canvas with `vessels`: adds new ones, moves/restyles changed ones, removes
 * ones that are gone. Unchanged vessels cost nothing; the canvas redraws once per frame.
 */
export function syncVessels(canvas, vessels, onClick) {
  const { layers, renderer, group } = canvas;
  const seen = new Set();

  for (const vessel of vessels) {
    const id = String(vessel.mmsi);
    seen.add(id);
    const heading = vesselHeading(vessel);
    const fillColor = vesselColor(vessel);
    const alert = isAlertVessel(vessel);
    const label = alert ? vessel.name || '' : '';

    let layer = layers.get(id);
    if (!layer) {
      layer = new VesselArrow(vessel.position, {
        renderer,
        radius: 10,
        heading,
        alert,
        label,
        fillColor,
        fillOpacity: 1,
        color: PAPER,
        weight: 1.4,
        opacity: 1,
      });
      layer.on('click', () => onClick(layer.vessel));
      layers.set(id, layer);
      group.addLayer(layer);
    } else {
      const { lat, lng } = layer.getLatLng();
      if (lat !== vessel.position[0] || lng !== vessel.position[1]) {
        layer.setLatLng(vessel.position);
      }
      const o = layer.options;
      if (o.heading !== heading || o.fillColor !== fillColor || o.alert !== alert || o.label !== label) {
        layer.setStyle({ heading, fillColor, alert, label });
      }
    }
    layer.vessel = vessel;
  }

  for (const [id, layer] of layers) {
    if (!seen.has(id)) {
      group.removeLayer(layer);
      layers.delete(id);
    }
  }
}
