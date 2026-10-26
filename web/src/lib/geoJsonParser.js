/**
 * GeoJSON Parser & Normalizer for Maritime Surveillance Restricted Areas
 *
 * Converts various GeoJSON structures (FeatureCollection, Feature, Geometry)
 * into normalized payloads required by POST /api/restricted-areas:
 * {
 *   name: string,
 *   type: 'military' | 'sanctuary' | 'anchorage' | 'port' | 'cable' | string,
 *   coordinates: [{ lat: number, lon: number }, ...]
 * }
 */

const VALID_TYPES = ['military', 'sanctuary', 'anchorage', 'port', 'cable', 'restricted'];

/**
 * Normalize type string to a recognizable category
 */
export function normalizeZoneType(rawType) {
  if (!rawType || typeof rawType !== 'string') return 'military';
  const lower = rawType.toLowerCase().trim();

  if (lower.includes('milit') || lower.includes('defense') || lower.includes('navy') || lower.includes('exclusion')) {
    return 'military';
  }
  if (lower.includes('sanct') || lower.includes('marine') || lower.includes('protect') || lower.includes('nature') || lower.includes('mpa')) {
    return 'sanctuary';
  }
  if (lower.includes('anchor') || lower.includes('roadstead') || lower.includes('berth')) {
    return 'anchorage';
  }
  if (lower.includes('port') || lower.includes('harbor') || lower.includes('harbour') || lower.includes('terminal') || lower.includes('vts')) {
    return 'port';
  }
  if (lower.includes('cable') || lower.includes('pipe') || lower.includes('corridor') || lower.includes('subsea')) {
    return 'cable';
  }

  return lower.slice(0, 50) || 'military';
}

/**
 * Extract human-readable name from feature properties or fallback
 */
export function extractZoneName(properties = {}, index = 0, fallbackBase = 'Restricted Area') {
  const candidates = [
    properties.name,
    properties.NAME,
    properties.title,
    properties.TITLE,
    properties.zone_name,
    properties.zone,
    properties.ZoneName,
    properties.identifier,
    properties.id,
    properties.ID,
    properties.Name,
    properties.description,
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) {
      return c.trim();
    }
    if (typeof c === 'number') {
      return `${fallbackBase} #${c}`;
    }
  }

  return `${fallbackBase} ${index + 1}`;
}

/**
 * Convert GeoJSON [lon, lat] ring to array of { lat, lon }
 */
export function ringToCoordinates(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return null;

  const coords = [];
  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length < 2) continue;
    const lon = Number(pt[0]);
    const lat = Number(pt[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;

    coords.push({
      lat: Number(lat.toFixed(6)),
      lon: Number(lon.toFixed(6)),
    });
  }

  // Deduplicate consecutive identical points
  const deduped = coords.filter((c, i) => {
    if (i === 0) return true;
    const prev = coords[i - 1];
    return !(prev.lat === c.lat && prev.lon === c.lon);
  });

  // Need at least 3 distinct vertices
  const uniquePoints = new Set(deduped.map((c) => `${c.lat},${c.lon}`));
  if (uniquePoints.size < 3) return null;

  return deduped;
}

/**
 * Calculate bounding box and centroid for a list of coordinates
 */
export function calculateBoundsAndCentroid(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return { bounds: null, centroid: null };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  let sumLat = 0;
  let sumLon = 0;

  for (const c of coordinates) {
    if (c.lat < minLat) minLat = c.lat;
    if (c.lat > maxLat) maxLat = c.lat;
    if (c.lon < minLon) minLon = c.lon;
    if (c.lon > maxLon) maxLon = c.lon;
    sumLat += c.lat;
    sumLon += c.lon;
  }

  const count = coordinates.length;
  return {
    bounds: [
      [minLat, minLon],
      [maxLat, maxLon],
    ],
    centroid: {
      lat: Number((sumLat / count).toFixed(6)),
      lon: Number((sumLon / count).toFixed(6)),
    },
  };
}

/**
 * Parses a GeoJSON object (FeatureCollection, Feature, or Geometry)
 * Returns an array of normalized zone objects ready for review / upload.
 */
export function parseGeoJsonObject(geoJson, fileName = 'Imported') {
  if (!geoJson || typeof geoJson !== 'object') {
    throw new Error('Invalid GeoJSON: input must be a valid JSON object.');
  }

  const fallbackBase = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') || 'Zone';
  const zones = [];
  const errors = [];

  // Helper to extract polygon rings from a geometry
  function processGeometry(geometry, properties = {}, index = 0) {
    if (!geometry || !geometry.type || !geometry.coordinates) {
      errors.push(`Feature #${index + 1}: Missing or invalid geometry`);
      return;
    }

    const type = geometry.type;
    const zoneName = extractZoneName(properties, zones.length, fallbackBase);
    const zoneType = normalizeZoneType(
      properties.type || properties.category || properties.classification
    );

    if (type === 'Polygon') {
      // Outer ring is coordinates[0]
      const outerRing = geometry.coordinates[0];
      const coords = ringToCoordinates(outerRing);
      if (coords) {
        const { bounds, centroid } = calculateBoundsAndCentroid(coords);
        zones.push({
          tempId: `import-${Date.now()}-${zones.length}`,
          name: zoneName,
          type: zoneType,
          coordinates: coords,
          verticesCount: coords.length,
          bounds,
          centroid,
          properties,
        });
      } else {
        errors.push(`Feature "${zoneName}": Polygon has insufficient valid coordinates.`);
      }
    } else if (type === 'MultiPolygon') {
      // Multiple polygons
      geometry.coordinates.forEach((polyCoords, partIdx) => {
        const outerRing = polyCoords[0];
        const coords = ringToCoordinates(outerRing);
        if (coords) {
          const partName =
            geometry.coordinates.length > 1
              ? `${zoneName} (Part ${partIdx + 1})`
              : zoneName;
          const { bounds, centroid } = calculateBoundsAndCentroid(coords);
          zones.push({
            tempId: `import-${Date.now()}-${zones.length}`,
            name: partName,
            type: zoneType,
            coordinates: coords,
            verticesCount: coords.length,
            bounds,
            centroid,
            properties,
          });
        }
      });
    } else {
      errors.push(`Feature #${index + 1}: Geometry type "${type}" is not supported (only Polygon and MultiPolygon).`);
    }
  }

  // 1. FeatureCollection
  if (geoJson.type === 'FeatureCollection' && Array.isArray(geoJson.features)) {
    geoJson.features.forEach((feature, idx) => {
      if (feature && feature.geometry) {
        processGeometry(feature.geometry, feature.properties || {}, idx);
      }
    });
  }
  // 2. Single Feature
  else if (geoJson.type === 'Feature' && geoJson.geometry) {
    processGeometry(geoJson.geometry, geoJson.properties || {}, 0);
  }
  // 3. Raw Geometry (Polygon / MultiPolygon)
  else if (geoJson.type === 'Polygon' || geoJson.type === 'MultiPolygon') {
    processGeometry(geoJson, {}, 0);
  }
  // 4. GeometryCollection
  else if (geoJson.type === 'GeometryCollection' && Array.isArray(geoJson.geometries)) {
    geoJson.geometries.forEach((geom, idx) => {
      processGeometry(geom, {}, idx);
    });
  } else {
    throw new Error(
      `Unsupported GeoJSON format. Root object must be FeatureCollection, Feature, or Polygon.`
    );
  }

  if (zones.length === 0 && errors.length > 0) {
    throw new Error(`Failed to extract valid polygon zones:\n${errors.join('\n')}`);
  }

  return { zones, errors };
}

/**
 * Reads a File object and parses its contents as GeoJSON
 */
export async function parseGeoJsonFile(file) {
  if (!file) throw new Error('No file provided.');

  let text;
  try {
    text = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('FileReader failed to read file.'));
      reader.readAsText(file);
    });
  } catch (readerErr) {
    if (typeof file.text === 'function') {
      text = await file.text();
    } else {
      throw readerErr;
    }
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON file: ${err.message}`);
  }

  return parseGeoJsonObject(json, file.name);
}
