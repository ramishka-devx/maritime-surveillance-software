function parseAIS(msg) {

  if (!msg.MetaData || !msg.Message) return null;

  const meta = msg.MetaData;
  const report = msg.Message.PositionReport;

  if (!report) return null;

  return {
    mmsi: meta.MMSI,
    ship_name: meta.ShipName?.trim(),

    lat: meta.latitude,
    lon: meta.longitude,

    sog: report.Sog,
    cog: report.Cog,
    heading: report.TrueHeading,

    nav_status: report.NavigationalStatus,

    time: new Date(meta.time_utc).toISOString(),

    raw: msg
  };
}

module.exports = parseAIS;
