import test from 'node:test';
import assert from 'node:assert/strict';
import { ANOMALY_ALERT, alertSeverity } from '../src/modules/anomalies/anomaly.service.js';
import { DEFAULTS, SETTINGS, crossCheck } from '../src/modules/detection-settings/detection-settings.registry.js';

test('speed alert severity follows the score; without a score the type default applies', () => {
  assert.equal(alertSeverity(ANOMALY_ALERT.speed, 0.8, 0.75), 'high');
  assert.equal(alertSeverity(ANOMALY_ALERT.speed, 0.75, 0.75), 'high');
  assert.equal(alertSeverity(ANOMALY_ALERT.speed, 0.62, 0.75), 'medium');
  assert.equal(alertSeverity(ANOMALY_ALERT.speed, null, 0.75), 'high');
  assert.equal(alertSeverity(ANOMALY_ALERT.loitering, 0.9, 0.75), 'medium');
});

test('defaults are valid and consistent', () => {
  for (const [key, s] of Object.entries(SETTINGS)) {
    assert.equal(s.schema.validate(s.default).error, undefined, key);
  }
  assert.equal(crossCheck(DEFAULTS), null);
});

test('warning must not exceed the alert threshold; high severity must be at least it', () => {
  assert.match(crossCheck({ ...DEFAULTS, 'speed.warning_threshold': 0.8 }), /warning threshold/);
  assert.match(crossCheck({ ...DEFAULTS, 'speed.high_severity_score': 0.6 }), /high-severity/);
  assert.equal(crossCheck({ ...DEFAULTS, 'speed.warning_threshold': DEFAULTS['speed.score_threshold'] }), null);
});

test('settings reject out-of-range values', () => {
  assert.ok(SETTINGS['speed.score_threshold'].schema.validate(0.3).error);
  assert.ok(SETTINGS['loitering.radius_m'].schema.validate(10).error);
  assert.equal(SETTINGS['speed.fallback_p99_kn'].schema.validate(null).error, undefined);
});
