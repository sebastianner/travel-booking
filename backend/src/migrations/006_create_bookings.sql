-- booking_code and created_at added here: the frontend result screen (Part 3) needs a
-- reference code and a booking timestamp; nothing to derive them from elsewhere.
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES packages (id),
    seats_booked INT NOT NULL CHECK (seats_booked > 0),
    booking_code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
