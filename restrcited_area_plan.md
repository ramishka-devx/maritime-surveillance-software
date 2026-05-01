see the meta-service backend.
there I want to create a new module to manage all the restricted areas.

in the database there is a table,
```SQL
CREATE TABLE restricted_areas (
    id SERIAL PRIMARY KEY,
    name TEXT,
    type TEXT, -- coral, military, protected_zone
    geom GEOGRAPHY(POLYGON, 4326)
);
```

I have created the table for u.

1. make a api to add a restricted area,
use this sql :

```SQL
INSERT INTO restricted_areas (name, type, geom)
VALUES (
    'Coral Reef Zone A',
    'coral',
    ST_GeogFromText(
        'POLYGON((
            79.820 6.930, 
            79.880 6.930,
            79.880 6.970,
            79.820 6.970,
            79.820 6.930
        ))'
    )
);
```
from manuallu user should send the cordinates.

2 - detect ships entered in restricted areas

```SQL
SELECT 
    s.ship_name,
    s.mmsi,
    r.name AS restricted_zone,
    s.time_utc
FROM ais_positions s
JOIN restricted_areas r
ON ST_Intersects(s.position, r.geom);

```
