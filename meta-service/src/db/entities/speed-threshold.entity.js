import { EntitySchema } from 'typeorm';

// p99 SOG per vessel-type group: p99_computed from analytic-service, p99_override from an admin.
export const SpeedThreshold = new EntitySchema({
  name: 'SpeedThreshold',
  tableName: 'speed_thresholds',
  columns: {
    type_group: { type: 'smallint', primary: true },
    label: { type: 'text' },
    p99_computed: { type: 'real', nullable: true },
    sample_count: { type: 'integer', default: 0 },
    computed_at: { type: 'timestamptz', nullable: true },
    p99_override: { type: 'real', nullable: true },
    updated_by: {
      type: 'integer',
      nullable: true,
      foreignKey: { target: 'User', name: 'speed_thresholds_updated_by_fkey', onDelete: 'SET NULL' }
    },
    updated_at: { type: 'timestamptz', default: () => 'now()' }
  },
  checks: [
    {
      name: 'chk_speed_thresholds_override',
      expression: 'p99_override IS NULL OR (p99_override > 0 AND p99_override <= 100)'
    }
  ]
});
