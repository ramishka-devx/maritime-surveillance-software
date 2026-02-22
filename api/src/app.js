import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import { env } from './config/env.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import morgan from 'morgan'

// Routes
import userRoutes from './modules/users/user.routes.js';
import roleRoutes from './modules/roles/role.routes.js';
import permissionRoutes from './modules/permissions/permission.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import activityRoutes from './modules/activities/activity.routes.js';
import vesselRoutes from './modules/vessels/vessel.routes.js';
import positionRoutes from './modules/positions/position.routes.js';
import alertRoutes from './modules/alerts/alert.routes.js';
import aisRoutes from './modules/ais/ais.routes.js';

const app = express();

// Security & basics
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: env.rateLimit.windowMs, max: env.rateLimit.max }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/vessels', vesselRoutes);
app.use('/api/ais', aisRoutes);
app.use('/api', positionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handler
app.use(errorMiddleware);

export default app;
