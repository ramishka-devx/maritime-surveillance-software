-- restricted_areas: geofenced zones used by
-- meta-service/src/modules/restricted-areas (ST_GeogFromText / ST_Intersects).
-- Reconstructed from restrcited_area_plan.md and restricted-area.model.js;
-- the original table was applied by hand to the (now lost) database.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS restricted_areas (
    id   SERIAL PRIMARY KEY,
    name TEXT,
    type TEXT,                       -- e.g. coral, military, protected_zone
    geom GEOGRAPHY(POLYGON, 4326)
);

CREATE INDEX IF NOT EXISTS idx_restricted_areas_geom ON restricted_areas USING GIST (geom);
