CREATE TABLE ship_types (
    ship_type_id SMALLINT PRIMARY KEY,
    description TEXT NOT NULL
);

CREATE TABLE ships (
    mmsi BIGINT PRIMARY KEY,
    
    ship_name TEXT,

    ship_type SMALLINT
        REFERENCES ship_types(ship_type_id),

    dimensions JSONB,

    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE ais_positions (
    
    id BIGSERIAL,

    mmsi BIGINT NOT NULL REFERENCES ships(mmsi),

    sog REAL,
    cog REAL,
    heading REAL,

    nav_status SMALLINT,

    lon DOUBLE PRECISION,
    lat DOUBLE PRECISION,

    geom GEOMETRY(Point, 4326),

    time TIMESTAMP NOT NULL,

    width REAL,
    length REAL,
    ship_type SMALLINT NOT NULL REFERENCES ship_types(ship_type_id)

    PRIMARY KEY (id, time)

)
PARTITION BY RANGE (time);

