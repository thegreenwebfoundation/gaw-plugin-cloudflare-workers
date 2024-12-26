/**
 * Type definitions
 * @typedef {import('./types').cloudflareRequest} cloudflareRequest The incoming request object.
 * @typedef {import('./types').locationOptions} locationOptions Additional options for the function.
 * @typedef {import('./types').locationResponse} locationResponse The location of the user.
 * @typedef {import('./types').cloudflareResponse} cloudflareResponse The response object to save.
 * @typedef {import('./types').cloudflareEnv} cloudflareEnv Cloudflare environment.
 * @typedef {import('./types').kvOptions} kvOptions Additional options for the function.
 */

/**
 * Get the location of the user from the request object.
 * @param {cloudflareRequest} request The incoming request object.
 * @param {locationOptions} [options] Additional options for the function.
 * @returns {locationResponse} The location of the user.
 * @example
 * const location = getLocation(request);
 */
function getLocation(request, options) {
  const mode = options?.mode || "country";

  const country = request.cf?.country;

  if (mode === "latlon") {
    const lat = request.cf?.latitude;
    const lon = request.cf?.longitude;

    if (!lat || !lon) {
      return {
        status: "error",
      };
    }

    return {
      status: "success",
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
    status: "success",
    country,
  };
}

/**
 * Save a page response to the KV store.
 * @param {cloudflareEnv} env Cloudflare environment.
 * @param {string} key The key to save the response under. We recommend using the URL as the key.
 * @param {cloudflareResponse} response The response object to save.
 * @param {kvOptions} [options] Additional options for the function.
 * @example
 * savePageToKv(env, "https://example.com/page", response);
 */ 
async function savePageToKv(env, key, response, options) {
  if (!env || !key || !response) {
    return {
      status: "error",
    };
  }

  if(!env.GAW_PAGE_KV) {
    return {
      status: "error",
      message: "GAW_PAGE_KV not found in environment. Please create it.",
    };
  }

  let expirationTtl = 60 * 60 * 24;

  if(options?.expirationTtl && typeof options?.expirationTtl === 'number') {
    expirationTtl = options.expirationTtl;
  }

  try {
    const responseBody = response.body;
    await env.GAW_PAGE_KV.put(key, responseBody);
    return; // Return undefined on success
  } catch (error) {
    return {
      status: "error",
    };
  }
}

/**
 * Fetch a page response from the KV store.
 * @param {cloudflareEnv} env Cloudflare environment.
 * @param {string} key The key to fetch the response from. We recommend using the URL as the key.
 * @return {Promise<string | Object | ArrayBuffer | ReadableStream | null>} The response object from the KV store.
 */
async function fetchPageFromKv(env, key) {
  if (!env || !key) {
    return {
      status: "error",
    };
  }

  if(!env.GAW_PAGE_KV) {
    return {
      status: "error",
      message: "GAW_PAGE_KV not found in environment. Please create it.",
    };
  }

  return await env.GAW_PAGE_KV.get(key);
}

export { getLocation, savePageToKv, fetchPageFromKv };