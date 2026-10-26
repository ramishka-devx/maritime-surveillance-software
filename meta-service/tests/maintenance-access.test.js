import test from 'node:test';
import assert from 'node:assert/strict';
import { canMaintenanceAccess, isMaintenanceRole, isSystemHealthApi } from '../src/utils/maintenanceAccess.js';
import { permissionMiddleware } from '../src/middleware/permissionMiddleware.js';
import { env } from '../src/config/env.js';
import { isMaintenance } from '../../web/src/auth/roles.js';

test('maintenance role detection supports login strings, profile objects, and primary role', () => {
  assert.equal(isMaintenanceRole({ name: 'Maintenance' }), true);
  assert.equal(isMaintenance({ roles: ['maintenance', 'super_admin'] }), true);
  assert.equal(isMaintenance({ roles: [{ name: 'maintenance' }] }), true);
  assert.equal(isMaintenance({ role: 'maintenance', roles: ['super_admin'] }), true);
  assert.equal(isMaintenance({ roles: ['operator'] }), false);
  assert.equal(isMaintenance(null), false);
});

test('maintenance API access is restricted to read-only diagnostics and session bootstrap', () => {
  for (const path of ['/api/system-health', '/api/system-health/', '/api/system/health?refresh=1', '/api/users/me']) {
    assert.equal(canMaintenanceAccess('GET', path), true);
  }
  for (const path of ['/api/users', '/api/roles', '/api/users/1', '/api/alerts', '/api/ais/positions/latest', '/api/permissions', '/api/system-health-other']) {
    assert.equal(canMaintenanceAccess('GET', path), false);
  }
  assert.equal(canMaintenanceAccess('POST', '/api/system-health'), false);
  assert.equal(canMaintenanceAccess('PUT', '/api/users/me'), false);
  assert.equal(isSystemHealthApi('/api/system-health?refresh=1'), true);
  assert.equal(isSystemHealthApi('/api/system/health/'), true);
  assert.equal(isSystemHealthApi('/api/users/me'), false);
  assert.equal(isSystemHealthApi('/api/system-health-other'), false);
});

test('health access is denied to every non-Maintenance role before bypasses', async () => {
  const previous = env.permissionsBypass;
  env.permissionsBypass = true;
  try {
    for (const role of ['super_admin', 'admin', 'operator']) {
      for (const permission of ['system_health.view', 'system.health.view', ['system_health.view', 'users.list']]) {
        let result;
        await permissionMiddleware(permission)({
          user: { user_id: 1, role, role_id: 1 }, isMaintenance: false,
          method: 'GET', originalUrl: '/api/system-health',
        }, {}, error => { result = error; });
        assert.equal(result?.statusCode, 403);
      }
    }
  } finally {
    env.permissionsBypass = previous;
  }
});

test('maintenance restriction precedes development and elevated-role bypasses', async () => {
  const previous = env.permissionsBypass;
  env.permissionsBypass = true;
  try {
    const check = async (permission, originalUrl) => {
      let result;
      await permissionMiddleware(permission)({
        user: { user_id: 1, role_id: 1 }, isMaintenance: true, method: 'GET', originalUrl,
      }, {}, error => { result = error || 'allowed'; });
      return result;
    };
    assert.equal(await check('system_health.view', '/api/system-health'), 'allowed');
    assert.equal((await check('users.list', '/api/users')).statusCode, 403);
    assert.equal((await check('roles.permissions.assign', '/api/system-health')).statusCode, 403);
    assert.equal((await check(['system_health.view', 'users.list'], '/api/system-health')).statusCode, 403);
  } finally {
    env.permissionsBypass = previous;
  }
});
