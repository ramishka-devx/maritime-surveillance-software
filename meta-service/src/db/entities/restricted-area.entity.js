import { EntitySchema } from 'typeorm';

export const RestrictedArea = new EntitySchema({
  name: 'RestrictedArea',
  tableName: 'restricted_areas',
  columns: {
    id: { type: 'integer', primary: true, generated: 'increment' },
    name: { type: 'text', nullable: true },
    type: { type: 'text', nullable: true }, // e.g. coral, military, protected_zone
    geom: {
      type: 'geography',
      spatialFeatureType: 'Polygon',
      srid: 4326,
      nullable: true
    }
  },
  indices: [{ name: 'idx_restricted_areas_geom', columns: ['geom'], spatial: true }]
});
