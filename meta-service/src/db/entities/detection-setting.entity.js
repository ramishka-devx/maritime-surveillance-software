import { EntitySchema } from 'typeorm';

// Admin-editable detector settings (REQ-F-047). Keys and their validation live in
// modules/detection-settings/detection-settings.registry.js.
export const DetectionSetting = new EntitySchema({
  name: 'DetectionSetting',
  tableName: 'detection_settings',
  columns: {
    key: { type: 'text', primary: true },
    value: { type: 'jsonb' },
    updated_by: {
      type: 'integer',
      nullable: true,
      foreignKey: { target: 'User', name: 'detection_settings_updated_by_fkey', onDelete: 'SET NULL' }
    },
    updated_at: { type: 'timestamptz', default: () => 'now()' }
  }
});
