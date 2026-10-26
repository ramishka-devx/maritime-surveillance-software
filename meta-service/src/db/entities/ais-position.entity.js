import { EntitySchema } from 'typeorm';

// Range-partitioned by time_utc (daily partitions + DEFAULT). TypeORM can't express
// partitioning, so the table, its partitions and create_next_two_partitions() live in
// the InitialSchema migration; this entity only mirrors the parent table's columns.
export const AisPosition = new EntitySchema({
  name: 'AisPosition',
  tableName: 'ais_positions',
  columns: {
    id: { type: 'bigint', primary: true, generated: 'increment' },
    mmsi: {
      type: 'bigint',
      foreignKey: { target: 'Ship', name: 'ais_positions_mmsi_fkey' }
    },
    ship_name: { type: 'text', nullable: true },
    sog: { type: 'real', nullable: true },
    cog: { type: 'real', nullable: true },
    heading: { type: 'real', nullable: true },
    nav_status: { type: 'smallint', nullable: true },
    lon: { type: 'double precision', nullable: true },
    lat: { type: 'double precision', nullable: true },
    position: {
      type: 'geography',
      spatialFeatureType: 'Point',
      srid: 4326,
      nullable: true
    },
    time_utc: { type: 'timestamp', primary: true },
    width: { type: 'real', nullable: true },
    length: { type: 'real', nullable: true },
    ship_type: {
      type: 'smallint',
      foreignKey: { target: 'ShipType', name: 'ais_positions_ship_type_fkey' }
    }
  },
  indices: [
    // DESC on time_utc is set in the migration; TypeORM indices don't carry sort order.
    { name: 'idx_ais_positions_mmsi_time', columns: ['mmsi', 'time_utc'] },
    { name: 'idx_ais_positions_time', columns: ['time_utc'] },
    { name: 'idx_ais_positions_position', columns: ['position'], spatial: true }
  ]
});
