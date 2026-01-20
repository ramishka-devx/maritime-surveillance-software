import { Router } from 'express';
import { UserController } from './user.controller.js';
import { validate } from '../../middleware/validateRequest.js';
import { registerSchema, loginSchema, updateSchema, updateStatusSchema, updateRoleSchema } from './user.validation.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';
import { activityLogger } from '../../middleware/activityLogger.js';

const router = Router();

/**
 * @openapi
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 */
router.post('/register', validate(registerSchema), UserController.register);

/**
 * @openapi
 * /api/users/login:
 *   post:
 *     summary: Login
 */
router.post('/login', validate(loginSchema), UserController.login);

router.get('/me', authMiddleware, UserController.me);

router.get('/', authMiddleware, permissionMiddleware('user.list'), UserController.list);

/**
 * @openapi
 * /api/users/analytics:
 *   get:
 *     summary: Get user analytics counts
 */
router.get('/analytics', authMiddleware, UserController.analytics);

router.put('/:user_id', authMiddleware, permissionMiddleware('user.update'), activityLogger('user.update'), validate(updateSchema), UserController.update);

/**
 * @openapi
 * /api/users/{user_id}/status:
 *   put:
 *     summary: Update user status
 */
router.put('/:user_id/status', authMiddleware, permissionMiddleware('user.status.update'), activityLogger('user.status.update'), validate(updateStatusSchema), UserController.updateStatus);

/**
 * @openapi
 * /api/users/{user_id}/role:
 *   put:
 *     summary: Update user role
 */
router.put('/:user_id/role', authMiddleware, permissionMiddleware('user.role.update'), activityLogger('user.role.update'), validate(updateRoleSchema), UserController.updateRole);

// router.delete('/:user_id', authMiddleware, permissionMiddleware('user.delete'), activityLogger('user.delete'), UserController.remove);

export default router;
