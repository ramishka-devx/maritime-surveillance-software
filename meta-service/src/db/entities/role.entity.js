import { EntitySchema } from 'typeorm';

export const Role = new EntitySchema({
  name: 'Role',
  tableName: 'roles',
  columns: {
    role_id: { type: 'integer', primary: true, generated: 'identity' },
    name: { type: 'varchar', length: 50 },
    description: { type: 'text', nullable: true },
    is_system: { type: 'smallint', default: 0 },
    is_active: { type: 'smallint', default: 1 },
    created_at: { type: 'timestamptz', default: () => 'now()' },
    updated_at: { type: 'timestamptz', default: () => 'now()' }
  },
  uniques: [{ name: 'roles_name_key', columns: ['name'] }]
});
