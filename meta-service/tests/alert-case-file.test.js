import test from 'node:test';
import assert from 'node:assert/strict';
import { anomalyTitle, darkVesselTitle, geofenceTitle, motion, vesselLabel } from '../src/modules/alerts/alert-text.js';
import { listSchema } from '../src/modules/alerts/alert.validation.js';
import { flagFromMmsi, midOf } from '../../web/src/lib/mid.js';

test('detector titles read as sentences', () => {
  assert.equal(geofenceTitle({ vessel: 'MSC LEIGH', zone: 'R-12', sog: 4.24 }), 'MSC LEIGH entered R-12 at 4.2 kn');
  assert.equal(geofenceTitle({ vessel: 'MSC LEIGH', zone: 'R-12', sog: null }), 'MSC LEIGH entered R-12');
  assert.equal(
    anomalyTitle('speed', { vessel: 'LUCKY 7', sog: 21.3, p99: 8.2 }),
    'LUCKY 7 reported 21.3 kn, above the 8.2 kn norm for similar vessels'
  );
  assert.equal(anomalyTitle('speed', { vessel: 'LUCKY 7', sog: 21.3, p99: null }), 'LUCKY 7 reported an unusual speed of 21.3 kn');
  assert.equal(anomalyTitle('behavoir', { vessel: 'SEA W', sog: 0.3 }), 'SEA W is holding position at 0.3 kn');
  assert.equal(anomalyTitle('route', { vessel: 'X' }), 'X deviated from its expected route');
  assert.equal(darkVesselTitle({ vessel: 'NORDIC STAR', sog: 11.4 }), 'NORDIC STAR went silent after reporting at 11.4 kn');
  assert.equal(vesselLabel('  ', 244245000), 'MMSI 244245000');
  assert.equal(motion(4.2, 118.4), 'at 4.2 kn, course 118°');
  assert.equal(motion(null, null), '');
});

test('alert list accepts one status or a comma-separated list, nothing else', () => {
  const ok = (status) => !listSchema.validate({ query: { status } }).error;
  assert.equal(ok('open'), true);
  assert.equal(ok('open,acknowledged,escalated'), true);
  assert.equal(ok('open,'), false);
  assert.equal(ok('open,bogus'), false);
  assert.equal(ok("open'); DROP TABLE alerts;--"), false);
});

test('flag state from the MMSI country prefix (MID)', () => {
  assert.equal(flagFromMmsi('244245000')?.name, 'Netherlands');
  assert.equal(flagFromMmsi(352004811)?.code, 'PA');
  assert.equal(flagFromMmsi('232027082')?.name, 'United Kingdom');
  assert.equal(midOf('992446001'), '244'); // aid to navigation: 99MID
  assert.equal(midOf('002440001'), '244'); // coast station: 00MID
  assert.equal(midOf('111244001'), '244'); // SAR aircraft: 111MID
  assert.equal(flagFromMmsi('123456789'), null);
  assert.equal(flagFromMmsi('abc'), null);
});

test('dark-vessel detector treats a burst of simultaneous silences as a coverage gap', async () => {
  const { dropCoverageGaps } = await import('../src/cron/darkVesselDetector.js');
  const at = (hhmm) => new Date(`2026-10-27T${hhmm}:00Z`);
  const burst = ['17:31', '17:33', '17:35', '17:38'].map((t, i) => ({ mmsi: i, last_position_at: at(t) }));
  const lone = { mmsi: 99, last_position_at: at('16:05') };
  assert.deepEqual(dropCoverageGaps([...burst, lone]).map((c) => c.mmsi), [99]);
  assert.equal(dropCoverageGaps(burst.slice(0, 3)).length, 3);
});
