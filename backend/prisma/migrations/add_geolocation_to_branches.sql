-- Add geolocation columns to branches table
ALTER TABLE branches 
ADD COLUMN latitude DECIMAL(10, 8) NULL,
ADD COLUMN longitude DECIMAL(11, 8) NULL,
ADD COLUMN location_radius_meters INT DEFAULT 500;

-- Add index for location queries
CREATE INDEX idx_branch_location ON branches(latitude, longitude);
