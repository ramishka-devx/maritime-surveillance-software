import { EntitySchema } from 'typeorm';

export const ShipType = new EntitySchema({
  name: 'ShipType',
  tableName: 'ship_types',
  columns: {
    // AIS "type of ship and cargo" code; rows 0-99 are seeded by the SeedShipTypes migration.
    ship_type_id: { type: 'smallint', primary: true },
    description: { type: 'text' }
  },
  checks: [{ name: 'chk_ship_types_id', expression: 'ship_type_id BETWEEN 0 AND 99' }]
});
