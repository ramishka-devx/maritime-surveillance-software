import { EntitySchema } from 'typeorm';

// Written by ingest-service (and stub rows by anomaly.model.js), keyed by MMSI.
export const Ship = new EntitySchema({
  name: 'Ship',
  tableName: 'ships',
  columns: {
    mmsi: { type: 'bigint', primary: true },
    ship_name: { type: 'text', nullable: true },
    ship_type: {
      type: 'smallint',
      nullable: true,
      foreignKey: { target: 'ShipType', name: 'ships_ship_type_fkey' }
    },
    dimensions: { type: 'jsonb', nullable: true },
    created_at: { type: 'timestamp', nullable: true, default: () => 'now()' },
    updated_at: { type: 'timestamp', nullable: true, default: () => 'now()' },
    // Latest position, kept current by ingest-service so the map needn't scan ais_positions.
    lat: { type: 'double precision', nullable: true },
    lon: { type: 'double precision', nullable: true },
    sog: { type: 'real', nullable: true },
    cog: { type: 'real', nullable: true },
    heading: { type: 'real', nullable: true },
    nav_status: { type: 'smallint', nullable: true },
    last_position_at: { type: 'timestamp', nullable: true }
  },
  // DESC is set in the migration; TypeORM indices don't carry sort order.
  indices: [{ name: 'idx_ships_last_position_at', columns: ['last_position_at'] }]
});
