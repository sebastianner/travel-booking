CREATE TABLE IF NOT EXISTS package_flights (
    package_id UUID NOT NULL REFERENCES packages (id) ON DELETE CASCADE,
    flight_id UUID NOT NULL REFERENCES flight_details (id) ON DELETE CASCADE,
    PRIMARY KEY (package_id, flight_id)
);
