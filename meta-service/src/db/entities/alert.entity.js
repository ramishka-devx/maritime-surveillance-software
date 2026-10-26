import { EntitySchema } from 'typeorm';

export const Alert = new EntitySchema({
  name: 'Alert',
  tableName: 'alerts',
  columns: {
    alert_id: { type: 'integer', primary: true, generated: 'identity' },
    vessel_id: {
      type: 'integer',
      nullable: true,
      foreignKey: { target: 'Vessel', name: 'alerts_vessel_id_fkey', onDelete: 'SET NULL' }
    },
    type: { type: 'varchar', length: 30, default: 'manual' },
    severity: { type: 'varchar', length: 20, default: 'medium' },
    status: { type: 'varchar', length: 20, default: 'open' },
    title: { type: 'varchar', length: 255 },
    description: { type: 'text', nullable: true },
    created_by: {
      type: 'integer',
      foreignKey: { target: 'User', name: 'alerts_created_by_fkey' }
    },
    assigned_to: {
      type: 'integer',
      nullable: true,
      foreignKey: { target: 'User', name: 'alerts_assigned_to_fkey', onDelete: 'SET NULL' }
    },
    created_at: { type: 'timestamptz', default: () => 'now()' },
    updated_at: { type: 'timestamptz', default: () => 'now()' },
    resolved_at: { type: 'timestamptz', nullable: true }
  },
  indices: [
    { name: 'idx_alerts_status', columns: ['status'] },
    { name: 'idx_alerts_severity', columns: ['severity'] },
    { name: 'idx_alerts_vessel', columns: ['vessel_id'] }
  ],
  checks: [
    {
      name: 'chk_alerts_type',
      expression: "type IN ('geofence', 'speed', 'collision_risk', 'dark_vessel', 'manual')"
    },
    {
      name: 'chk_alerts_severity',
      expression: "severity IN ('low', 'medium', 'high', 'critical')"
    },
    {
      name: 'chk_alerts_status',
      expression: "status IN ('open', 'acknowledged', 'resolved', 'dismissed')"
    }
  ]
});
