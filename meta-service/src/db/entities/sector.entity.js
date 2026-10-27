import { EntitySchema } from 'typeorm';

// Named areas of interest the dashboard can be scoped to.
export const Sector = new EntitySchema({
  name: 'Sector',
  tableName: 'sectors',
  columns: {
    id: { type: 'integer', primary: true, generated: 'increment' },
    name: { type: 'text' },
    geom: { type: 'geography', spatialFeatureType: 'Polygon', srid: 4326 },
    created_at: { type: 'timestamptz', default: () => 'now()' }
  },
  uniques: [{ name: 'sectors_name_key', columns: ['name'] }],
  indices: [{ name: 'idx_sectors_geom', columns: ['geom'], spatial: true }]
});
