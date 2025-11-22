-- Add GeoJSON storage for retailer/customer locations
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location_geojson JSONB;

-- Create functional index to speed up lookups by geometry values (if needed later)
CREATE INDEX IF NOT EXISTS profiles_location_geojson_gin
  ON public.profiles
  USING GIN (location_geojson);

-- Backfill GeoJSON for existing rows that already have coordinates
UPDATE public.profiles
SET location_geojson = jsonb_build_object(
  'type', 'Feature',
  'geometry', jsonb_build_object(
    'type', 'Point',
    'coordinates', jsonb_build_array(location_lng, location_lat)
  ),
  'properties', jsonb_build_object(
    'source', 'backfill',
    'updated_at', now()
  )
)
WHERE location_geojson IS NULL
  AND location_lat IS NOT NULL
  AND location_lng IS NOT NULL;

