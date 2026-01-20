import { Router } from 'express';
import { RoleController } from './role.controller.js';
import { validate } from '../../middleware/validateRequest.js';
import { 
  listSchema, 
  getByIdSchema, 
  createSchema, 
  updateSchema, 
  deleteSchema,
  rolePermissionMutateSchema,
  rolePermissionSyncSchema
} from './role.validation.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { permissionMiddleware } from '../../middleware/permissionMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/roles:
 *   get:
 *     summary: Get all roles with pagination
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     rows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           role_id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                     total:
 *                       type: integer
 */
router.get('/', authMiddleware, permissionMiddleware('roles.list'), validate(listSchema), RoleController.list);

/**
 * @openapi
 * /api/roles/all:
 *   get:
 *     summary: Get all roles without pagination
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role_id:
 *                         type: integer
 *                       name:
 *                         type: string
 */
router.get('/all', authMiddleware, permissionMiddleware('roles.list'), RoleController.getAll);

/**
 * @openapi
 * /api/roles/{role_id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     role_id:
 *                       type: integer
 *                     name:
 *                       type: string
 *       404:
 *         description: Role not found
 */
router.get('/:role_id', authMiddleware, permissionMiddleware('roles.view'), validate(getByIdSchema), RoleController.getById);

/**
 * @openapi
 * /api/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Role name
 *                 example: "Manager"
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     role_id:
 *                       type: integer
 *                     name:
 *                       type: string
 *       400:
 *         description: Bad request - validation error or role name already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post('/', authMiddleware, permissionMiddleware('roles.create'), validate(createSchema), RoleController.create);

/**
 * @openapi
 * /api/roles/{role_id}:
 *   put:
 *     summary: Update a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Role name
 *                 example: "Senior Manager"
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     role_id:
 *                       type: integer
 *                     name:
 *                       type: string
 *       400:
 *         description: Bad request - validation error or role name already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Role not found
 */
router.put('/:role_id', authMiddleware, permissionMiddleware('roles.update'), validate(updateSchema), RoleController.update);

/**
 * @openapi
 * /api/roles/{role_id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Role not found
 */
router.delete('/:role_id', authMiddleware, permissionMiddleware('roles.delete'), validate(deleteSchema), RoleController.delete);

// ==========================================
// Role Permission Management Routes
// ==========================================

/**
 * @openapi
 * /api/roles/{role_id}/permissions:
 *   get:
 *     summary: Get all permissions assigned to a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of permissions assigned to the role
 */
router.get('/:role_id/permissions', authMiddleware, permissionMiddleware('roles.permissions.view'), validate(getByIdSchema), RoleController.getPermissions);

/**
 * @openapi
 * /api/roles/{role_id}/permissions/all:
 *   get:
 *     summary: Get all permissions with assignment status for a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of all permissions with assigned flag
 */
router.get('/:role_id/permissions/all', authMiddleware, permissionMiddleware('roles.permissions.view'), validate(getByIdSchema), RoleController.getPermissionsWithAssignment);

/**
 * @openapi
 * /api/roles/{role_id}/permissions/assign:
 *   post:
 *     summary: Assign a permission to a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission_id
 *             properties:
 *               permission_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Permission assigned successfully
 */
router.post('/:role_id/permissions/assign', authMiddleware, permissionMiddleware('roles.permissions.assign'), validate(rolePermissionMutateSchema), RoleController.assignPermission);

/**
 * @openapi
 * /api/roles/{role_id}/permissions/revoke:
 *   post:
 *     summary: Revoke a permission from a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission_id
 *             properties:
 *               permission_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Permission revoked successfully
 */
router.post('/:role_id/permissions/revoke', authMiddleware, permissionMiddleware('roles.permissions.revoke'), validate(rolePermissionMutateSchema), RoleController.revokePermission);

/**
 * @openapi
 * /api/roles/{role_id}/permissions/sync:
 *   post:
 *     summary: Sync all permissions for a role (replace all with new set)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission_ids
 *             properties:
 *               permission_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Permissions synchronized successfully
 */
router.post('/:role_id/permissions/sync', authMiddleware, permissionMiddleware('roles.permissions.assign'), validate(rolePermissionSyncSchema), RoleController.syncPermissions);

/**
 * @openapi
 * /api/roles/{role_id}/users:
 *   get:
 *     summary: Get all users assigned to a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of users with this role
 */
router.get('/:role_id/users', authMiddleware, permissionMiddleware('roles.view'), validate(getByIdSchema), RoleController.getUsersWithRole);

/**
 * @openapi
 * /api/roles/stats:
 *   get:
 *     summary: Get role statistics (permission counts, user counts)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Role statistics
 */
router.get('/stats/overview', authMiddleware, permissionMiddleware('roles.list'), RoleController.getStats);

export default router;