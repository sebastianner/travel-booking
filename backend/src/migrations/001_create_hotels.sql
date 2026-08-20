CREATE TABLE IF NOT EXISTS hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    nights INT NOT NULL CHECK (nights > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0)
);
