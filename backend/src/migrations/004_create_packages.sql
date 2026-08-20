-- Package price is intentionally not stored here: it's derived at query time as
-- SUM(flight_details.price for its legs) + hotel.price + travel_insurance.price.
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    available_spots INT NOT NULL CHECK (available_spots >= 0),
    hotel_id UUID NOT NULL REFERENCES hotels (id),
    insurance_id UUID NOT NULL REFERENCES travel_insurance (id)
);
