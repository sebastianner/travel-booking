CREATE TABLE IF NOT EXISTS flight_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    flight_time_minutes INT NOT NULL CHECK (flight_time_minutes > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    CHECK (arrival_time > departure_time)
);
