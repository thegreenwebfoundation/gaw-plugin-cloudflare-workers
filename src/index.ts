import type {
  CFRequest,
  LocationOptions,
  LocationResponse,
  CFResponse,
} from "./types";

/**
 * Retrieves location information from a Cloudflare request
 * @param request - The Cloudflare request object containing geolocation data
 * @param options - Configuration options for location data retrieval
 * @returns Location data in the format specified by the mode option, or an error status
 */
function getLocation(
  request: CFRequest,
  options?: LocationOptions
): LocationResponse {
  const mode = options?.mode || "country";

  const country = request.cf?.country;

  if (mode === "latlon") {
    const lat = request.cf?.latitude;
    const lon = request.cf?.longitude;

    if (!lat || !lon) {
      if (!country) {
        return {
          status: "error",
        };
      }

      return {
        country,
      };
    }

    return {
      lat,
      lon,
    };
  }

  if (!country) {
    return {
      status: "error",
    };
  }

  return {
    country,
  };
}

export { getLocation };
export type { CFRequest, LocationOptions, LocationResponse };
