import { EntitySchema } from 'typeorm';

export const Notification = new EntitySchema({
  name: 'Notification',
  tableName: 'notifications',
  columns: {
    notification_id: { type: 'integer', primary: true, generated: 'identity' },
    user_id: {
      type: 'integer',
      foreignKey: { target: 'User', name: 'notifications_user_id_fkey', onDelete: 'CASCADE' }
    },
    type: { type: 'varchar', length: 50 },
    title: { type: 'varchar', length: 255 },
    message: { type: 'text' },
    entity_type: { type: 'varchar', length: 50, nullable: true },
    entity_id: { type: 'integer', nullable: true },
    priority: { type: 'varchar', length: 20, default: 'medium' },
    is_read: { type: 'smallint', default: 0 },
    read_at: { type: 'timestamptz', nullable: true },
    created_at: { type: 'timestamptz', default: () => 'now()' }
  },
  indices: [
    { name: 'idx_notifications_user', columns: ['user_id', 'is_read', 'created_at'] },
    { name: 'idx_notifications_type', columns: ['type'] },
    { name: 'idx_notifications_entity', columns: ['entity_type', 'entity_id'] }
  ],
  checks: [
    {
      name: 'chk_notifications_priority',
      expression: "priority IN ('low','medium','high','critical')"
    },
    { name: 'chk_notifications_is_read', expression: 'is_read IN (0, 1)' }
  ]
});
