CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    email text,
    phone text,
    addr_line1 text,
    city text,
    postal_code text,
    country text,
    geom geometry(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS customers_geom_gix ON customers USING GIST (geom);