// Degrees + decimal minutes, the chart convention: 6.95, 2, 'N', 'S' -> 06°57.0′N
export function formatCoord(v, digits, pos, neg) {
  const a = Math.abs(v);
  let deg = Math.floor(a);
  let min = (a - deg) * 60;
  if (min.toFixed(1) === '60.0') {
    deg += 1;
    min = 0;
  }
  return `${String(deg).padStart(digits, '0')}°${min.toFixed(1).padStart(4, '0')}′${v < 0 ? neg : pos}`;
}

// 6.95, 79.845 -> 06°57.0′N 079°50.7′E
export function formatLatLon(lat, lon) {
  return `${formatCoord(lat, 2, 'N', 'S')} ${formatCoord(lon, 3, 'E', 'W')}`;
}
