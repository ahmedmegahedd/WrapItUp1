/**
 * Reverse geocoding via Google Geocoding API.
 * Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env (enable Geocoding API in Google Cloud).
 */

export interface ReverseGeocodeResult {
  street: string;
  area: string;
  city: string;
  governorate: string;
  country: string;
  /** Formatted full address from API */
  formattedAddress: string;
}

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

function getComponent(
  components: Array<{ long_name: string; short_name: string; types: string[] }>,
  ...types: string[]
): string {
  const c = components.find((x) => types.some((t) => x.types.includes(t)));
  return c?.long_name ?? '';
}

/** Error with a user-facing message from the Geocoding API (e.g. enable API, invalid key). */
export class GeocodingError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'GeocodingError';
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  if (!API_KEY || !API_KEY.trim()) {
    throw new GeocodingError('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set', 'MISSING_KEY');
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status === 'OK') {
    const result = data.results?.[0];
    if (!result) {
      return emptyResult();
    }
    return parseResult(result);
  }

  if (data.status === 'ZERO_RESULTS') {
    return emptyResult();
  }

  const message = data.error_message || data.status || 'Geocoding failed';
  const code = data.status; // e.g. REQUEST_DENIED, OVER_QUERY_LIMIT
  throw new GeocodingError(message, code);
}

function emptyResult(): ReverseGeocodeResult {
  return {
    street: '',
    area: '',
    city: '',
    governorate: '',
    country: '',
    formattedAddress: '',
  };
}

function parseResult(result: any): ReverseGeocodeResult {
  const components = result.address_components ?? [];
  const streetNumber = getComponent(components, 'street_number');
  const route = getComponent(components, 'route');
  const street = [streetNumber, route].filter(Boolean).join(' ').trim();
  const locality = getComponent(components, 'locality');
  const sublocality = getComponent(components, 'sublocality', 'sublocality_level_1', 'neighborhood');
  const city = locality || sublocality || getComponent(components, 'administrative_area_level_2');
  const governorate = getComponent(components, 'administrative_area_level_1');
  const country = getComponent(components, 'country');

  return {
    street,
    area: sublocality || locality || '',
    city: city || governorate || '',
    governorate,
    country,
    formattedAddress: result.formatted_address ?? '',
  };
}

/** Build a Google Maps URL for the given coordinates */
export function buildMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/** Build a single-line address string from parts */
export function buildFullAddress(parts: {
  street?: string;
  area?: string;
  city?: string;
  governorate?: string;
  country?: string;
  formattedAddress?: string;
}): string {
  if (parts.formattedAddress?.trim()) return parts.formattedAddress.trim();
  const bits = [
    parts.street,
    parts.area,
    parts.city,
    parts.governorate,
    parts.country,
  ].filter(Boolean);
  return bits.join(', ');
}
