// Plain-language alert titles and timeline text, shared by the detectors.

export const kn = (v) => (v === null || v === undefined || v === '' ? null : `${Number(v).toFixed(1)} kn`);
export const deg = (v) => (v === null || v === undefined || v === '' ? null : `${Math.round(Number(v))}°`);
export const hhmm = (d) => `${new Date(d).toISOString().slice(11, 16)} UTC`;

// "MSC LEIGH" from the AIS name, else "MMSI 372123000".
export const vesselLabel = (name, mmsi) => (name && String(name).trim()) || `MMSI ${mmsi}`;

export function geofenceTitle({ vessel, zone, sog }) {
  return `${vessel} entered ${zone}${kn(sog) ? ` at ${kn(sog)}` : ''}`;
}

export function anomalyTitle(type, { vessel, sog, p99 }) {
  if (type === 'route') return `${vessel} deviated from its expected route`;
  if (type === 'behavoir' || type === 'loitering') {
    return `${vessel} is holding position${kn(sog) ? ` at ${kn(sog)}` : ''}`;
  }
  if (kn(sog) && kn(p99)) return `${vessel} reported ${kn(sog)}, above the ${kn(p99)} norm for similar vessels`;
  return `${vessel} reported an unusual speed${kn(sog) ? ` of ${kn(sog)}` : ''}`;
}

export function darkVesselTitle({ vessel, sog }) {
  return `${vessel} went silent after reporting at ${kn(sog) ?? 'speed'}`;
}

// "at 4.2 kn, course 118°" (whichever parts are known).
export function motion(sog, cog) {
  return [kn(sog) && `at ${kn(sog)}`, deg(cog) && `course ${deg(cog)}`].filter(Boolean).join(', ');
}
