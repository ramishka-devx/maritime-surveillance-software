-- ============================================================
-- Migration: 2026-10-28 – Add GIST spatial indexes
-- ============================================================
-- Without these, detectBreaches and detectEntries perform a
-- full cross-join scan of ais_positions × restricted_areas,
-- which blocks the API for 10–30 s on large datasets.
--
-- CONCURRENTLY means Postgres builds the index without locking
-- writes, so it is safe to run against a live database.
-- ============================================================

-- Spatial index on the live AIS position column (geography type).
-- Used by: ST_Intersects(s.position, r.geom) in every geofence query.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ais_positions_position_gist
  ON ais_positions
  USING GIST (position);

-- Spatial index on restricted-area polygons (geography type).
-- Small table but Postgres still needs it for the index join.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restricted_areas_geom_gist
  ON restricted_areas
  USING GIST (geom);

-- Supporting B-tree index on time_utc for the 15-minute watermark
-- window filter used by detectBreaches (sinceTime filter).
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ais_positions_time_utc
  ON ais_positions (time_utc DESC);

-- ============================================================
-- Verify (run after migration):
-- SELECT indexname, indexdef
-- FROM   pg_indexes
-- WHERE  tablename IN ('ais_positions', 'restricted_areas')
-- ORDER  BY tablename, indexname;
-- ============================================================
