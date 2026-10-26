import { EntitySchema } from 'typeorm';

export const RolePermission = new EntitySchema({
  name: 'RolePermission',
  tableName: 'role_permissions',
  columns: {
    role_id: {
      type: 'integer',
      primary: true,
      foreignKey: { target: 'Role', name: 'role_permissions_role_id_fkey', onDelete: 'CASCADE' }
    },
    permission_id: {
      type: 'integer',
      primary: true,
      foreignKey: {
        target: 'Permission',
        name: 'role_permissions_permission_id_fkey',
        onDelete: 'CASCADE'
      }
    },
    granted_at: { type: 'timestamptz', default: () => 'now()' },
    granted_by: {
      type: 'integer',
      nullable: true,
      foreignKey: { target: 'User', name: 'role_permissions_granted_by_fkey', onDelete: 'SET NULL' }
    }
  },
  indices: [{ name: 'idx_rp_permission', columns: ['permission_id'] }]
});
