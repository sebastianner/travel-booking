CREATE TABLE IF NOT EXISTS travel_insurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coverage_details VARCHAR(160) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0)
);
