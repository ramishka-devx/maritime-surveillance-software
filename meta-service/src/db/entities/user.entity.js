import { EntitySchema } from 'typeorm';

export const User = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    user_id: { type: 'integer', primary: true, generated: 'identity' },
    first_name: { type: 'varchar', length: 50 },
    last_name: { type: 'varchar', length: 50 },
    username: { type: 'varchar', length: 50 },
    email: { type: 'varchar', length: 100 },
    password_hash: { type: 'varchar', length: 255 },
    role_id: {
      type: 'integer',
      foreignKey: { target: 'Role', name: 'users_role_id_fkey' }
    },
    status: { type: 'varchar', length: 20, default: 'pending' },
    profile_img: {
      type: 'varchar',
      length: 2048,
      default: 'https://res.cloudinary.com/dftbkrs4f/image/upload/v1732101562/avatar2_d0vokh.png'
    },
    created_at: { type: 'timestamptz', default: () => 'now()' },
    updated_at: { type: 'timestamptz', default: () => 'now()' }
  },
  uniques: [
    { name: 'users_username_key', columns: ['username'] },
    { name: 'users_email_key', columns: ['email'] }
  ],
  checks: [
    { name: 'chk_users_status', expression: "status IN ('pending', 'verified', 'disabled')" }
  ]
});
