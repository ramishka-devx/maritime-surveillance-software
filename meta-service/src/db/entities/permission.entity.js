import { EntitySchema } from 'typeorm';

export const Permission = new EntitySchema({
  name: 'Permission',
  tableName: 'permissions',
  columns: {
    permission_id: { type: 'integer', primary: true, generated: 'identity' },
    name: { type: 'varchar', length: 100 },
    module: { type: 'varchar', length: 50, nullable: true },
    description: { type: 'text', nullable: true },
    is_active: { type: 'smallint', default: 1 },
    created_at: { type: 'timestamptz', default: () => 'now()' }
  },
  uniques: [{ name: 'permissions_name_key', columns: ['name'] }]
});
