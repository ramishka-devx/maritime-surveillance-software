import { EntitySchema } from 'typeorm';

export const UserRole = new EntitySchema({
  name: 'UserRole',
  tableName: 'user_roles',
  columns: {
    user_id: {
      type: 'integer',
      primary: true,
      foreignKey: { target: 'User', name: 'user_roles_user_id_fkey', onDelete: 'CASCADE' }
    },
    role_id: {
      type: 'integer',
      primary: true,
      foreignKey: { target: 'Role', name: 'user_roles_role_id_fkey', onDelete: 'CASCADE' }
    },
    assigned_at: { type: 'timestamptz', default: () => 'now()' },
    assigned_by: {
      type: 'integer',
      nullable: true,
      foreignKey: { target: 'User', name: 'user_roles_assigned_by_fkey', onDelete: 'SET NULL' }
    }
  },
  indices: [
    { name: 'idx_ur_role', columns: ['role_id'] },
    { name: 'idx_ur_assigned_by', columns: ['assigned_by'] }
  ]
});
