import { Router } from 'express';
import { UserController } from './user.controller.js';
import { validate } from '../../middleware/validateRequest.js';
import {
	registerSchema,
	loginSchema,
	updateSchema,
	updateStatusSchema,
	updateRoleSchema,
	userPermissionListSchema,
	userPermissionMutateSchema,
	userRoleMutateSchema,
	userRoleSyncSchema,
} from './user.validation.js';
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
 *     summary: Login and get token with permissions
 */
router.post('/login', validate(loginSchema), UserController.login);

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Get current user profile with roles and permissions
 */
router.get('/me', authMiddleware, UserController.me);

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: List all users with pagination
 */
router.get('/', authMiddleware, permissionMiddleware('users.list'), UserController.list);

/**
 * @openapi
 * /api/users/analytics:
 *   get:
 *     summary: Get user analytics counts
 */
router.get('/analytics', authMiddleware, permissionMiddleware('analytics.dashboard.view'), UserController.analytics);

/**
 * @openapi
 * /api/users/{user_id}:
 *   put:
 *     summary: Update user details
 */
router.put('/:user_id', authMiddleware, permissionMiddleware('users.update'), activityLogger('users.update'), validate(updateSchema), UserController.update);

/**
 * @openapi
 * /api/users/{user_id}/status:
 *   put:
 *     summary: Update user status (verify/suspend)
 */
router.put('/:user_id/status', authMiddleware, permissionMiddleware(['users.verify', 'users.suspend']), activityLogger('users.verify'), validate(updateStatusSchema), UserController.updateStatus);

/**
 * @openapi
 * /api/users/{user_id}/role:
 *   put:
 *     summary: Update user's primary role (legacy)
 */
router.put('/:user_id/role', authMiddleware, permissionMiddleware('users.roles.assign'), activityLogger('users.roles.assign'), validate(updateRoleSchema), UserController.updateRole);

// ==========================================
// Multi-Role Management Routes
// ==========================================

/**
 * @openapi
 * /api/users/{user_id}/roles:
 *   get:
 *     summary: Get all roles assigned to a user
 */
router.get(
	'/:user_id/roles',
	authMiddleware,
	permissionMiddleware('users.view'),
	validate(userPermissionListSchema),
	UserController.getUserRoles
);

/**
 * @openapi
 * /api/users/{user_id}/roles/assign:
 *   post:
 *     summary: Assign a role to a user
 */
router.post(
	'/:user_id/roles/assign',
	authMiddleware,
	permissionMiddleware('users.roles.assign'),
	activityLogger('users.roles.assign'),
	validate(userRoleMutateSchema),
	UserController.assignRole
);

/**
 * @openapi
 * /api/users/{user_id}/roles/remove:
 *   post:
 *     summary: Remove a role from a user
 */
router.post(
	'/:user_id/roles/remove',
	authMiddleware,
	permissionMiddleware('users.roles.assign'),
	activityLogger('users.roles.remove'),
	validate(userRoleMutateSchema),
	UserController.removeRole
);

/**
 * @openapi
 * /api/users/{user_id}/roles/sync:
 *   post:
 *     summary: Sync all roles for a user (replace with new set)
 */
router.post(
	'/:user_id/roles/sync',
	authMiddleware,
	permissionMiddleware('users.roles.assign'),
	activityLogger('users.roles.sync'),
	validate(userRoleSyncSchema),
	UserController.syncRoles
);

// ==========================================
// Permission Management Routes
// ==========================================

/**
 * @openapi
 * /api/users/{user_id}/permissions:
 *   get:
 *     summary: Get all permissions with assignment status for a user
 */
router.get(
	'/:user_id/permissions',
	authMiddleware,
	permissionMiddleware('users.permissions.view'),
	validate(userPermissionListSchema),
	UserController.listUserPermissions
);

/**
 * @openapi
 * /api/users/{user_id}/permissions/direct:
 *   get:
 *     summary: Get only directly assigned permissions for a user
 */
router.get(
	'/:user_id/permissions/direct',
	authMiddleware,
	permissionMiddleware('users.permissions.view'),
	validate(userPermissionListSchema),
	UserController.getDirectPermissions
);

/**
 * @openapi
 * /api/users/{user_id}/permissions/effective:
 *   get:
 *     summary: Get all effective permissions (from roles + direct)
 */
router.get(
	'/:user_id/permissions/effective',
	authMiddleware,
	permissionMiddleware('users.permissions.view'),
	validate(userPermissionListSchema),
	UserController.getEffectivePermissions
);

/**
 * @openapi
 * /api/users/{user_id}/permissions/assign:
 *   post:
 *     summary: Assign a direct permission to a user
 */
router.post(
	'/:user_id/permissions/assign',
	authMiddleware,
	permissionMiddleware('users.permissions.assign'),
	activityLogger('users.permissions.assign'),
	validate(userPermissionMutateSchema),
	UserController.assignUserPermission
);

/**
 * @openapi
 * /api/users/{user_id}/permissions/revoke:
 *   post:
 *     summary: Revoke a direct permission from a user
 */
router.post(
	'/:user_id/permissions/revoke',
	authMiddleware,
	permissionMiddleware('users.permissions.assign'),
	activityLogger('users.permissions.revoke'),
	validate(userPermissionMutateSchema),
	UserController.revokeUserPermission
);

export default router;
