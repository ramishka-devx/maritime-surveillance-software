import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';
import { validate } from '../../middleware/validateRequest.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import { PermissionController } from './permission.controller.js';
import { createSchema, updateSchema, getByIdSchema, listSchema, assignSchema } from './permission.validation.js';

const router = Router();

/**
 * @openapi
 * /api/permissions:
 *   get:
 *     summary: List all permissions with pagination
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of permissions
 */
router.get('/', authMiddleware, permissionMiddleware('permissions.list'), validate(listSchema), PermissionController.list);

/**
 * @openapi
 * /api/permissions/all:
 *   get:
 *     summary: Get all permissions (no pagination)
 *     tags: [Permissions]
 */
router.get('/all', authMiddleware, permissionMiddleware('permissions.list'), PermissionController.listAll);

/**
 * @openapi
 * /api/permissions/by-module:
 *   get:
 *     summary: Get permissions grouped by module
 *     tags: [Permissions]
 */
router.get('/by-module', authMiddleware, permissionMiddleware('permissions.list'), PermissionController.listByModule);

/**
 * @openapi
 * /api/permissions/modules:
 *   get:
 *     summary: Get list of permission modules
 *     tags: [Permissions]
 */
router.get('/modules', authMiddleware, permissionMiddleware('permissions.list'), PermissionController.getModules);

/**
 * @openapi
 * /api/permissions/{permission_id}:
 *   get:
 *     summary: Get permission by ID
 *     tags: [Permissions]
 */
router.get('/:permission_id', authMiddleware, permissionMiddleware('permissions.view'), validate(getByIdSchema), PermissionController.getById);

/**
 * @openapi
 * /api/permissions/{permission_id}/roles:
 *   get:
 *     summary: Get roles that have this permission
 *     tags: [Permissions]
 */
router.get('/:permission_id/roles', authMiddleware, permissionMiddleware('permissions.view'), validate(getByIdSchema), PermissionController.getRolesWithPermission);

/**
 * @openapi
 * /api/permissions:
 *   post:
 *     summary: Create a new permission
 *     tags: [Permissions]
 */
router.post('/', authMiddleware, permissionMiddleware('permissions.create'), activityLogger('permissions.create'), validate(createSchema), PermissionController.create);

/**
 * @openapi
 * /api/permissions/{permission_id}:
 *   put:
 *     summary: Update a permission
 *     tags: [Permissions]
 */
router.put('/:permission_id', authMiddleware, permissionMiddleware('permissions.create'), activityLogger('permissions.update'), validate(updateSchema), PermissionController.update);

/**
 * @openapi
 * /api/permissions/{permission_id}:
 *   delete:
 *     summary: Deactivate a permission (soft delete)
 *     tags: [Permissions]
 */
router.delete('/:permission_id', authMiddleware, permissionMiddleware('permissions.delete'), activityLogger('permissions.delete'), validate(getByIdSchema), PermissionController.remove);

// Legacy routes for backward compatibility
router.post('/assign', authMiddleware, permissionMiddleware('roles.permissions.assign'), activityLogger('roles.permissions.assign'), validate(assignSchema), PermissionController.assign);
router.post('/revoke', authMiddleware, permissionMiddleware('roles.permissions.revoke'), activityLogger('roles.permissions.revoke'), validate(assignSchema), PermissionController.revoke);

export default router;
