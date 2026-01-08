-- Migration: Add location fields to venues table
-- Description: Enables geolocation-based venue detection

-- Add location columns to venues table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Create index for faster location queries
CREATE INDEX IF NOT EXISTS idx_venues_location ON venues (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN venues.latitude IS 'Venue latitude coordinate (WGS84)';
COMMENT ON COLUMN venues.longitude IS 'Venue longitude coordinate (WGS84)';
COMMENT ON COLUMN venues.address IS 'Full street address of the venue';
COMMENT ON COLUMN venues.city IS 'City where the venue is located';
