import { badRequest, notFound } from '../../utils/errorHandler.js';
import { RestrictedAreaModel } from './restricted-area.model.js';

function normalizeCoordinate(value) {
  return Number.parseFloat(Number(value).toFixed(6));
}

function buildPolygonWkt(coordinates) {
  const normalized = coordinates.map(({ lat, lon }) => ({
    lat: normalizeCoordinate(lat),
    lon: normalizeCoordinate(lon)
  }));

  const uniqueVertices = new Set(normalized.map(({ lat, lon }) => `${lon},${lat}`));
  if (uniqueVertices.size < 3) {
    throw badRequest('At least 3 distinct coordinates are required to form a polygon');
  }

  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  const closed =
    first.lat === last.lat && first.lon === last.lon
      ? normalized
      : [...normalized, first];

  const points = closed.map(({ lat, lon }) => `${lon} ${lat}`).join(', ');
  return `POLYGON((${points}))`;
}

function parseGeometry(area) {
  if (!area) return area;

  return {
    ...area,
    geometry: area.geometry ? JSON.parse(area.geometry) : null
  };
}

export const RestrictedAreaService = {
  async create(payload) {
    const wktPolygon = buildPolygonWkt(payload.coordinates);
    const area = await RestrictedAreaModel.create({
      name: payload.name,
      type: payload.type,
      wktPolygon
    });

    return parseGeometry(area);
  },

  async list({ type } = {}) {
    const rows = await RestrictedAreaModel.list({ type: type || undefined });
    return rows.map(parseGeometry);
  },

  async getById(id) {
    const area = await RestrictedAreaModel.getById(id);
    if (!area) throw notFound('Restricted area not found');
    return parseGeometry(area);
  },

  async detectEntries(params = {}) {
    return RestrictedAreaModel.detectEntries({
      restricted_area_id: params.restricted_area_id,
      mmsi: params.mmsi,
      limit: params.limit
    });
  }
};
