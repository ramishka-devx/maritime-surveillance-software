// Vessel track helpers for the map's Track / Dossier buttons. Points are
// /api/ais/positions/:mmsi rows ({ lat, lon, sog, time_utc }) in chronological order.

export const TRACK_GAP_MS = 30 * 60 * 1000;

const valid = (p) => p && p.lat != null && p.lon != null;

// Lines of [lat, lon], split where two reports are more than gapMs apart, so a silent
// stretch isn't drawn as a confident straight line.
export function splitSegments(points, gapMs = TRACK_GAP_MS) {
  const segments = [];
  let prevTime = null;
  for (const p of points || []) {
    if (!valid(p)) continue;
    const t = new Date(p.time_utc).getTime();
    if (prevTime == null || t - prevTime > gapMs) segments.push([]);
    segments[segments.length - 1].push([Number(p.lat), Number(p.lon)]);
    prevTime = t;
  }
  return segments;
}

function haversineNm([lat1, lon1], [lat2, lon2]) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 3440.065 * Math.asin(Math.sqrt(a));
}

export function trackSummary(points) {
  const pts = (points || []).filter(valid);
  if (!pts.length) return null;
  let distanceNm = 0;
  for (let i = 1; i < pts.length; i++) {
    distanceNm += haversineNm([+pts[i - 1].lat, +pts[i - 1].lon], [+pts[i].lat, +pts[i].lon]);
  }
  // AIS sends 102.3 kn for "speed not available".
  const sogs = pts.map((p) => Number(p.sog)).filter((s) => Number.isFinite(s) && s < 102.3);
  return {
    reports: pts.length,
    distanceNm,
    from: pts[0].time_utc,
    to: pts[pts.length - 1].time_utc,
    avgSog: sogs.length ? sogs.reduce((a, b) => a + b, 0) / sogs.length : null,
    maxSog: sogs.length ? Math.max(...sogs) : null,
  };
}
