// Self-check for track.js: node web/src/lib/track.check.mjs
import assert from 'node:assert/strict';
import { splitSegments, trackSummary } from './track.js';

const at = (min) => new Date(Date.UTC(2026, 10, 4, 0, min)).toISOString();
const pts = [
  { lat: 52, lon: 4, sog: 10, time_utc: at(0) },
  { lat: 52.1, lon: 4, sog: 12, time_utc: at(10) },
  { lat: null, lon: null, sog: 0, time_utc: at(12) },
  { lat: 52.5, lon: 4, sog: 102.3, time_utc: at(60) }, // 50 min gap -> new segment; sog n/a
];

assert.deepEqual(splitSegments(pts), [[[52, 4], [52.1, 4]], [[52.5, 4]]]);
assert.deepEqual(splitSegments([]), []);

const s = trackSummary(pts);
assert.equal(s.reports, 3);
assert.ok(Math.abs(s.distanceNm - 30) < 0.1, `0.5° of latitude is ~30 nm, got ${s.distanceNm}`);
assert.equal(s.avgSog, 11);
assert.equal(s.maxSog, 12);
assert.equal(s.from, at(0));
assert.equal(s.to, at(60));
assert.equal(trackSummary([]), null);

console.log('track.js ok');
