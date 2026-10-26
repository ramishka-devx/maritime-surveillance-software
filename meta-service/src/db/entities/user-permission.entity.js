import { EntitySchema } from 'typeorm';

export const UserPermission = new EntitySchema({
  name: 'UserPermission',
  tableName: 'user_permissions',
  columns: {
    user_id: {
      type: 'integer',
      primary: true,
      foreignKey: { target: 'User', name: 'user_permissions_user_id_fkey', onDelete: 'CASCADE' }
    },
    permission_id: {
      type: 'integer',
      primary: true,
      foreignKey: {
        target: 'Permission',
        name: 'user_permissions_permission_id_fkey',
        onDelete: 'CASCADE'
      }
    },
    assigned_at: { type: 'timestamptz', default: () => 'now()' },
    assigned_by: {
      type: 'integer',
      nullable: true,
      foreignKey: {
        target: 'User',
        name: 'user_permissions_assigned_by_fkey',
        onDelete: 'SET NULL'
      }
    }
  },
  indices: [
    { name: 'idx_up_permission', columns: ['permission_id'] },
    { name: 'idx_up_assigned_by', columns: ['assigned_by'] }
  ]
});
