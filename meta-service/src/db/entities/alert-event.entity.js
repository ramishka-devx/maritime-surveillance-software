import { EntitySchema } from 'typeorm';

// One thing that happened to an alert: raised / observation (detectors) or status / assign /
// escalate (operators, with { from, to } in data).
export const AlertEvent = new EntitySchema({
  name: 'AlertEvent',
  tableName: 'alert_events',
  columns: {
    id: { type: 'bigint', primary: true, generated: 'increment' },
    alert_id: {
      type: 'integer',
      foreignKey: { target: 'Alert', name: 'alert_events_alert_id_fkey', onDelete: 'CASCADE' }
    },
    at: { type: 'timestamptz', default: () => 'now()' },
    kind: { type: 'varchar', length: 20 },
    text: { type: 'text' },
    actor_id: {
      type: 'integer',
      nullable: true,
      foreignKey: { target: 'User', name: 'alert_events_actor_id_fkey', onDelete: 'SET NULL' }
    },
    data: { type: 'jsonb', nullable: true }
  },
  indices: [{ name: 'idx_alert_events_alert_at', columns: ['alert_id', 'at'] }],
  checks: [
    {
      name: 'chk_alert_events_kind',
      expression: "kind IN ('raised', 'observation', 'status', 'assign', 'escalate')"
    }
  ]
});
