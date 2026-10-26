import L from 'leaflet';

// Vessels drawn on one Leaflet canvas instead of one DOM element each, so thousands of them
// pan/zoom smoothly and a poll only redraws the canvas instead of mounting/unmounting DOM.

const COLORS = {
  critical: '#ef4444',
  warning: '#f59e0b',
  normal: '#38bdf8',
  cargo: '#3b82f6',
  tanker: '#f59e0b',
  fishing: '#10b981',
  military: '#a855f7',
  unknown: '#94a3b8',
};

export function vesselColor(vessel) {
  const statusKey = vessel.threatLevel?.toLowerCase() || vessel.status?.toLowerCase() || 'normal';
  return COLORS[statusKey] || COLORS.normal;
}

export function vesselHeading(vessel) {
  return vessel.heading || vessel.cog || vessel.course || 0;
}

// Same arrowhead as the DOM icon (polygon 16,2 26,28 16,22 6,28 in a 32px box, drawn at
// 26px), centred on the vessel position.
const ARROW_SCALE = 26 / 32;
const ARROW = [
  [0, -14],
  [10, 12],
  [0, 6],
  [-10, 12],
];

L.Canvas.include({
  // Mirrors L.Canvas#_updateCircle, but traces a rotated arrow instead of a circle.
  _updateVesselArrow(layer) {
    if (!this._drawing || layer._empty()) return;

    const { x, y } = layer._point;
    const ctx = this._ctx;
    const { heading = 0, critical } = layer.options;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((heading * Math.PI) / 180);
    ctx.scale(ARROW_SCALE, ARROW_SCALE);
    ctx.beginPath();
    ARROW.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.restore(); // the path survives restore; stroke width stays in screen pixels
    this._fillStroke(ctx, layer);

    if (critical) {
      ctx.beginPath();
      ctx.arc(x + 12, y - 12, 4, 0, Math.PI * 2);
      ctx.globalAlpha = 1;
      ctx.fillStyle = COLORS.critical;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
  },
});

// CircleMarker gives us canvas hit-testing (by radius), click events and setLatLng redraws;
// only the drawing is replaced. Must be used with a canvas renderer.
const VesselArrow = L.CircleMarker.extend({
  _updatePath() {
    this._renderer._updateVesselArrow(this);
  },
});

/**
 * Creates the canvas state for a map: one renderer, one layer group, MMSI -> layer index.
 */
export function createVesselCanvas(map) {
  const renderer = L.canvas({ padding: 0.5 });
  const group = L.layerGroup().addTo(map);
  return {
    layers: new Map(),
    renderer,
    group,
    remove() {
      group.remove();
      map.removeLayer(renderer);
    },
  };
}

/**
 * Reconciles the canvas with `vessels`: adds new ones, moves/restyles changed ones, removes
 * ones that are gone. Unchanged vessels cost nothing; the canvas redraws once per frame.
 */
export function syncVessels(canvas, vessels, onClick) {
  const { layers, renderer, group } = canvas;
  const seen = new Set();

  for (const vessel of vessels) {
    const id = String(vessel.mmsi);
    seen.add(id);
    const heading = vesselHeading(vessel);
    const fillColor = vesselColor(vessel);
    const critical = vessel.threatLevel === 'CRITICAL';

    let layer = layers.get(id);
    if (!layer) {
      layer = new VesselArrow(vessel.position, {
        renderer,
        radius: 11,
        heading,
        critical,
        fillColor,
        fillOpacity: 1,
        color: '#ffffff',
        weight: 1.6,
        opacity: 1,
      });
      layer.on('click', () => onClick(layer.vessel));
      layers.set(id, layer);
      group.addLayer(layer);
    } else {
      const { lat, lng } = layer.getLatLng();
      if (lat !== vessel.position[0] || lng !== vessel.position[1]) {
        layer.setLatLng(vessel.position);
      }
      const o = layer.options;
      if (o.heading !== heading || o.fillColor !== fillColor || o.critical !== critical) {
        layer.setStyle({ heading, fillColor, critical });
      }
    }
    layer.vessel = vessel;
  }

  for (const [id, layer] of layers) {
    if (!seen.has(id)) {
      group.removeLayer(layer);
      layers.delete(id);
    }
  }
}
