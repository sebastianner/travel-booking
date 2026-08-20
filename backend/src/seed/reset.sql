-- Restores demo data to its original seeded state: clears all bookings and puts
-- every package's available_spots back to its initial seed value. Useful after
-- manual testing/demoing has consumed real inventory.
TRUNCATE bookings;

UPDATE packages SET available_spots = 12 WHERE id = '40000000-0000-0000-0000-000000000001';
UPDATE packages SET available_spots = 3  WHERE id = '40000000-0000-0000-0000-000000000002';
UPDATE packages SET available_spots = 8  WHERE id = '40000000-0000-0000-0000-000000000003';
UPDATE packages SET available_spots = 0  WHERE id = '40000000-0000-0000-0000-000000000004';
UPDATE packages SET available_spots = 15 WHERE id = '40000000-0000-0000-0000-000000000005';
UPDATE packages SET available_spots = 2  WHERE id = '40000000-0000-0000-0000-000000000006';
UPDATE packages SET available_spots = 10 WHERE id = '40000000-0000-0000-0000-000000000007';
UPDATE packages SET available_spots = 6  WHERE id = '40000000-0000-0000-0000-000000000008';
