WITH ordered AS (
  SELECT
    mmsi,
    ship_name,
    time_utc,
    position,
    LAG(position) OVER (PARTITION BY mmsi ORDER BY time_utc) AS prev_pos,
    LAG(time_utc) OVER (PARTITION BY mmsi ORDER BY time_utc) AS prev_time
  FROM ais_positions
)
SELECT
  ship_name,
  COUNT(*) AS points,
  AVG(
    ST_Distance(
      position::geometry,
      prev_pos::geometry
    )
  ) AS avg_move_meters
FROM ordered
WHERE prev_pos IS NOT NULL
GROUP BY ship_name
HAVING
  AVG(ST_Distance(position::geometry, prev_pos::geometry)) < 100
  AND COUNT(*) > 50;
