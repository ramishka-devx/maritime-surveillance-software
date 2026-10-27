// One Esri map image of a lat/lon box, in plain lat/lon (EPSG:4326) so overlays drawn in
// degrees line up with it. The size keeps the box's aspect, so Esri doesn't widen the extent.
// Layers: 'World_Light_Gray_Base', 'World_Light_Gray_Reference' (place names).
export function esriMapImage(layer, { w, s, e, n }, width = 600) {
  const height = Math.round((width * (n - s)) / (e - w));
  return (
    `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${layer}/MapServer/export` +
    `?bbox=${w},${s},${e},${n}&bboxSR=4326&imageSR=4326&size=${width},${height}` +
    '&format=png32&transparent=true&f=image'
  );
}
