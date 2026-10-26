import { EntitySchema } from 'typeorm';

export const Vessel = new EntitySchema({
  name: 'Vessel',
  tableName: 'vessels',
  columns: {
    vessel_id: { type: 'integer', primary: true, generated: 'identity' },
    mmsi: { type: 'varchar', length: 9 },
    imo: { type: 'varchar', length: 10, nullable: true },
    name: { type: 'varchar', length: 120, nullable: true },
    callsign: { type: 'varchar', length: 20, nullable: true },
    flag: { type: 'varchar', length: 60, nullable: true },
    vessel_type: { type: 'varchar', length: 60, nullable: true },
    length_m: { type: 'numeric', precision: 6, scale: 2, nullable: true },
    width_m: { type: 'numeric', precision: 6, scale: 2, nullable: true },
    status: { type: 'varchar', length: 20, default: 'active' },
    created_at: { type: 'timestamptz', default: () => 'now()' },
    updated_at: { type: 'timestamptz', default: () => 'now()' }
  },
  uniques: [{ name: 'vessels_mmsi_key', columns: ['mmsi'] }],
  indices: [{ name: 'idx_vessels_name', columns: ['name'] }],
  checks: [{ name: 'chk_vessels_status', expression: "status IN ('active', 'inactive')" }]
});
