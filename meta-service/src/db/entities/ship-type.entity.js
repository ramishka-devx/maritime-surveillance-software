import { EntitySchema } from 'typeorm';

export const ShipType = new EntitySchema({
  name: 'ShipType',
  tableName: 'ship_types',
  columns: {
    ship_type_id: { type: 'smallint', primary: true },
    description: { type: 'text' }
  }
});
