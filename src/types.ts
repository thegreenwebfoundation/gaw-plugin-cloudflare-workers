// types.ts

/**
 * Interface representing a Cloudflare request object with geolocation data
 */
export interface CFRequest {
  cf?: {
    /** ISO 3166-1 alpha-2 country code */
    country?: string;
    /** Latitude coordinate of the request origin */
    latitude?: number;
    /** Longitude coordinate of the request origin */
    longitude?: number;
  };
}

/**
 * Options for configuring location data retrieval
 */
export interface LocationOptions {
  /**
   * Mode of location data to return
   * - 'country': Returns country code only
   * - 'latlon': Returns latitude/longitude coordinates if available, falls back to country
   */
  mode?: "country" | "latlon";
}

export interface CFResponse {
  status: number;
  statusText: string;
  headers: Headers;
  body: ReadableStream<Uint8Array> | null;
}

/**
 * Union type representing possible location response formats
 */
export type LocationResponse =
  | { country: string }
  | { lat: number; lon: number }
  | { status: "error" };
