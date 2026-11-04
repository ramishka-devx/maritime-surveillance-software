import { EntitySchema } from 'typeorm';

export const Anomaly = new EntitySchema({
  name: 'Anomaly',
  tableName: 'anomalies',
  columns: {
    anomaly_id: { type: 'bigint', primary: true, generated: 'increment' },
    mmsi: {
      type: 'integer',
      foreignKey: { target: 'Ship', name: 'anomalies_mmsi_fkey', onDelete: 'CASCADE' }
    },
    // 'behavoir' (sic) is the stored value; the API validation and detectors use it.
    anomaly_type: {
      type: 'enum',
      enumName: 'anomaly_type_enum',
      enum: ['speed', 'route', 'behavoir', 'loitering', 'sts_transfer']
    },
    sog: { type: 'numeric', precision: 6, scale: 2, nullable: true },
    cog: { type: 'numeric', precision: 6, scale: 2, nullable: true },
    heading: { type: 'smallint', nullable: true },
    nav_status: { type: 'smallint', nullable: true },
    p99_speed: { type: 'numeric', precision: 6, scale: 2, nullable: true },
    details: { type: 'jsonb', nullable: true },
    lat: { type: 'double precision', nullable: true },
    lon: { type: 'double precision', nullable: true },
    alt: { type: 'double precision', nullable: true },
    // IsolationForest anomaly score, 0-1 (~0.5 normal); null for rule-based detectors.
    score: { type: 'numeric', precision: 4, scale: 3, nullable: true },
    model_version: { type: 'text', nullable: true },
    detected_at: { type: 'timestamptz', default: () => 'now()' }
  },
  indices: [
    { name: 'idx_anomalies_vessel_time', columns: ['mmsi', 'detected_at'] },
    { name: 'idx_anomalies_type', columns: ['anomaly_type'] }
  ]
});
