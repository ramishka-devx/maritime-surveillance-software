function normalizeString(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeTimestamp(value) {
  if (!value) return null;

  const trimmed = String(value).trim();
  const match = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})(\.\d+)?\s+\+0000\s+UTC$/
  );

  const sanitized = match
    ? `${match[1]}T${match[2]}${match[3] || ""}Z`
    : trimmed.replace(/\s+/g, " ");

  const parsed = new Date(sanitized);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed.toISOString();
}

function parseDimensions(rawDimensions) {
  if (!rawDimensions || typeof rawDimensions !== "object") {
    return { dimensions: null, width: null, length: null };
  }

  const dim = {
    a: normalizeNumber(rawDimensions.A ?? rawDimensions.Bow),
    b: normalizeNumber(rawDimensions.B ?? rawDimensions.Stern),
    c: normalizeNumber(rawDimensions.C ?? rawDimensions.Port),
    d: normalizeNumber(rawDimensions.D ?? rawDimensions.Starboard)
  };

  const hasAnyDimension = Object.values(dim).some((value) => value !== null);
  if (!hasAnyDimension) {
    return { dimensions: null, width: null, length: null };
  }

  const length =
    dim.a !== null || dim.b !== null ? (dim.a || 0) + (dim.b || 0) : null;
  const width =
    dim.c !== null || dim.d !== null ? (dim.c || 0) + (dim.d || 0) : null;

  return {
    dimensions: dim,
    width,
    length
  };
}

function buildBasePayload(msg) {
  if (!msg?.MetaData || !msg?.Message) return null;

  const meta = msg.MetaData;
  const time = normalizeTimestamp(meta.time_utc);
  const lat = normalizeNumber(meta.latitude);
  const lon = normalizeNumber(meta.longitude);

  return {
    message_type: normalizeString(msg.MessageType),
    mmsi: normalizeNumber(meta.MMSI),
    ship_name: normalizeString(meta.ShipName),
    lat,
    lon,
    time,
    raw: msg
  };
}

function parsePositionReport(msg) {
  const base = buildBasePayload(msg);
  const report = msg?.Message?.PositionReport;

  if (!base || !report || base.mmsi === null || base.lat === null || base.lon === null || !base.time) {
    return null;
  }

  return {
    ...base,
    ship_type: null,
    dimensions: null,
    width: null,
    length: null,
    sog: normalizeNumber(report.Sog),
    cog: normalizeNumber(report.Cog),
    heading: normalizeNumber(report.TrueHeading),
    nav_status: normalizeNumber(report.NavigationalStatus)
  };
}

function parseShipStaticData(msg) {
  const base = buildBasePayload(msg);
  const report = msg?.Message?.ShipStaticData;

  if (!base || !report || base.mmsi === null) {
    return null;
  }

  const { dimensions, width, length } = parseDimensions(report.Dimension);

  return {
    ...base,
    ship_name: normalizeString(report.Name) || base.ship_name,
    ship_type: normalizeNumber(report.Type),
    dimensions,
    width,
    length,
    sog: null,
    cog: null,
    heading: null,
    nav_status: null
  };
}

function parseAIS(msg) {
  const messageType = normalizeString(msg?.MessageType);

  if (messageType === "PositionReport") {
    return parsePositionReport(msg);
  }

  if (messageType === "ShipStaticData") {
    return parseShipStaticData(msg);
  }

  return null;
}

module.exports = parseAIS;
