export interface GeoJsonPointFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties?: Record<string, unknown>
}

export interface GeoJsonSearchResult {
  feature: GeoJsonPointFeature
  displayName: string
  lat: number
  lng: number
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search'

const buildHeaders = () => ({
  Accept: 'application/geo+json, application/json',
  'Accept-Language': 'en',
})

export const toGeoJsonPoint = (lat: number, lng: number, properties?: Record<string, unknown>): GeoJsonPointFeature => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [lng, lat],
  },
  properties,
})

export async function searchGeoJsonLocation(query: string, limit = 5): Promise<GeoJsonSearchResult[]> {
  if (!query.trim()) {
    return []
  }

  const params = new URLSearchParams({
    q: query,
    format: 'geojson',
    polygon_geojson: '0',
    addressdetails: '1',
    limit: String(limit),
  })

  const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
    headers: buildHeaders(),
  })

  if (!response.ok) {
    throw new Error('Unable to fetch location data')
  }

  const data = await response.json()
  const features = Array.isArray(data?.features) ? data.features : []

  return features
    .filter((feature: any) => feature?.geometry?.type === 'Point')
    .map((feature: any) => {
      const [lng, lat] = feature.geometry.coordinates
      return {
        feature: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          properties: feature.properties,
        },
        displayName: feature.properties?.display_name ?? feature.properties?.name ?? query,
        lat,
        lng,
      } as GeoJsonSearchResult
    })
}

export const haversineDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

