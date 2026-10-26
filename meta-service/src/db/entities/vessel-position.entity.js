import { EntitySchema } from 'typeorm';

export const VesselPosition = new EntitySchema({
  name: 'VesselPosition',
  tableName: 'vessel_positions',
  columns: {
    position_id: { type: 'bigint', primary: true, generated: 'identity' },
    vessel_id: {
      type: 'integer',
      foreignKey: { target: 'Vessel', name: 'vessel_positions_vessel_id_fkey', onDelete: 'CASCADE' }
    },
    recorded_at: { type: 'timestamptz' },
    lat: { type: 'numeric', precision: 9, scale: 6 },
    lon: { type: 'numeric', precision: 9, scale: 6 },
    sog_kn: { type: 'numeric', precision: 6, scale: 2, nullable: true },
    cog_deg: { type: 'numeric', precision: 6, scale: 2, nullable: true },
    heading_deg: { type: 'smallint', nullable: true },
    nav_status: { type: 'varchar', length: 50, nullable: true },
    source: { type: 'varchar', length: 20, default: 'ais' },
    created_at: { type: 'timestamptz', default: () => 'now()' }
  },
  indices: [{ name: 'idx_positions_vessel_time', columns: ['vessel_id', 'recorded_at'] }],
  checks: [
    {
      name: 'chk_positions_source',
      expression: "source IN ('ais', 'radar', 'manual', 'fused')"
    }
  ]
});
