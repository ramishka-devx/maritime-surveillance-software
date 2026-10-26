import { EntitySchema } from 'typeorm';

export const Activity = new EntitySchema({
  name: 'Activity',
  tableName: 'activities',
  columns: {
    activity_id: { type: 'integer', primary: true, generated: 'identity' },
    user_id: {
      type: 'integer',
      foreignKey: { target: 'User', name: 'activities_user_id_fkey', onDelete: 'CASCADE' }
    },
    permission_id: {
      type: 'integer',
      nullable: true,
      foreignKey: {
        target: 'Permission',
        name: 'activities_permission_id_fkey',
        onDelete: 'SET NULL'
      }
    },
    method: { type: 'varchar', length: 10 },
    path: { type: 'varchar', length: 255 },
    status_code: { type: 'integer' },
    details: { type: 'jsonb', nullable: true },
    created_at: { type: 'timestamptz', default: () => 'now()' }
  },
  indices: [
    { name: 'idx_activities_user', columns: ['user_id'] },
    { name: 'idx_activities_permission', columns: ['permission_id'] },
    { name: 'idx_activities_created_at', columns: ['created_at'] }
  ]
});
