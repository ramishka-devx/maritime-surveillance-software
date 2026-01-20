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
import divisionTypeRoutes from './modules/divisionTypes/divisionType.routes.js';
import divisionRoutes from './modules/divisions/division.routes.js';
import machineRoutes from './modules/machines/machine.routes.js';
import meterRoutes from './modules/meters/meter.routes.js';
import parameterRoutes from './modules/parameters/parameter.routes.js';
import kaizenRoutes from './modules/kaizens/kaizen.routes.js';
import maintenanceRoutes from './modules/maintenance/maintenance.routes.js';

// Breakdown routes
import breakdownCategoryRoutes from './modules/breakdownCategories/breakdownCategory.routes.js';
import breakdownStatusRoutes from './modules/breakdownStatuses/breakdownStatus.routes.js';
import breakdownRoutes from './modules/breakdowns/breakdown.routes.js';
import breakdownRepairRoutes from './modules/breakdownRepairs/breakdownRepair.routes.js';
import breakdownCommentRoutes from './modules/breakdownComments/breakdownComment.routes.js';
import breakdownAttachmentRoutes from './modules/breakdownAttachments/breakdownAttachment.routes.js';
import breakdownAnalyticsRoutes from './modules/breakdownAnalytics/breakdownAnalytics.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import activityRoutes from './modules/activities/activity.routes.js';

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
app.use('/api/division-types', divisionTypeRoutes);
app.use('/api/divisions', divisionRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/meters', meterRoutes);
app.use('/api/parameters', parameterRoutes);
app.use('/api/kaizens', kaizenRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Breakdown management routes
app.use('/api/breakdown-categories', breakdownCategoryRoutes);
app.use('/api/breakdown-statuses', breakdownStatusRoutes);
app.use('/api/breakdowns', breakdownRoutes);
app.use('/api', breakdownRepairRoutes);  // Uses nested routes like /api/breakdown/:id/repairs
app.use('/api', breakdownCommentRoutes); // Uses nested routes like /api/breakdown/:id/comments
app.use('/api', breakdownAttachmentRoutes); // Uses nested routes like /api/breakdown/:id/attachments
app.use('/api/analytics/breakdowns', breakdownAnalyticsRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handler
app.use(errorMiddleware);

export default app;
