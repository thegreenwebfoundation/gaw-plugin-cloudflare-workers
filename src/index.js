import { GridIntensity } from "@greenweb/grid-aware-websites";

/**
 * Type definitions
 * @typedef {import('./types').cloudflareRequest} cloudflareRequest The incoming request object.
 * @typedef {import('./types').locationOptions} locationOptions Additional options for the function.
 * @typedef {import('./types').locationResponse} locationResponse The location of the user.
 * @typedef {import('./types').cloudflareResponse} cloudflareResponse The response object to save.
 * @typedef {import('./types').cloudflareEnv} cloudflareEnv Cloudflare environment.
 * @typedef {import('./types').kvOptions} kvOptions Additional options for the function.
 * @typedef {import('./types').cloudflareContext} cloudflareContext Cloudflare Workers ExecutionContext
 */

// import { HTMLRewriter } from '@cloudflare/workers-types';

/**
 * Get the location of the user from the request object.
 * @param {cloudflareRequest} request The incoming request object.
 * @param {locationOptions} [options] Additional options for the function.
 * @returns {locationResponse} The location of the user.
 */
function getLocation(request, options) {
  const mode = options?.mode || "country";

  const country =
    typeof request.cf?.country === "string" ? request.cf.country : undefined;

  if (mode === "latlon") {
    const lat =
      typeof request.cf?.latitude === "string"
        ? request.cf.latitude
        : undefined;
    const lon =
      typeof request.cf?.longitude === "string"
        ? request.cf.longitude
        : undefined;

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
 * @param {Response} response The response object to save.
 * @param {kvOptions} [options] Additional options for the function.\
 * @returns {Promise<void>}
 * @example
 * savePageToKv(env, "https://example.com/page", response);
 */
async function savePageToKv(env, key, response, options) {
  let expirationTtl = 60 * 60 * 24;

  if (options?.expirationTtl && typeof options?.expirationTtl === "number") {
    expirationTtl = options.expirationTtl;
  }

  try {
    const responseBody = await response.text();
    await env.GAW_PAGE_KV.put(key, responseBody, { expirationTtl });
    return Promise.resolve();
  } catch {
    return Promise.reject();
  }
}

/**
 * Fetch a page response from the KV store.
 * @param {cloudflareEnv} env Cloudflare environment.
 * @param {string} key The key to fetch the response from. We recommend using the URL as the key.
 * @return {Promise<string | Object | ArrayBuffer | ReadableStream | null>} The response object from the KV store.
 */
async function fetchPageFromKv(env, key) {
  return await env.GAW_PAGE_KV.get(key);
}

/**
 * Save electricity data to a KV store.
 * @param {cloudflareEnv} env Cloudflare environment
 * @param {string} key The key to save the response under. We recommend using either the country code or lat-lon values
 * @param {string | ArrayBuffer | ArrayBufferView | import('@cloudflare/workers-types').ReadableStream} data The data to be saved
 * @param {kvOptions} [options] Additional options for the function
 * @return {Promise<void>}
 */
async function saveDataToKv(env, key, data, options) {
  let expirationTtl = 60 * 60; // Default 1 hour

  if (options?.expirationTtl && typeof options?.expirationTtl === "number") {
    expirationTtl = options.expirationTtl;
  }

  return await env.GAW_DATA_KV.put(key, data, { expirationTtl });
}

/**
 * Fetch electricity data from a KV store.
 * @param {cloudflareEnv} env Cloudflare environment.
 * @param {string} key The key to fetch the response for. We recommend using the country code or lat-lon values
 * @return {Promise<string | Object | ArrayBuffer | ReadableStream | null>}
 */
async function fetchDataFromKv(env, key) {
  return await env.GAW_DATA_KV.get(key);
}

/**
 * Automatically applies Grid Aware Website (GAW) modifications to incoming web requests based on grid data.
 * This function handles the core GAW implementation for Cloudflare Workers by checking location data,
 * fetching grid/power data, and conditionally modifying HTML responses.
 *
 * @param {cloudflareRequest} request - The incoming request object from Cloudflare.
 * @param {cloudflareEnv} env - The Cloudflare environment containing KV bindings and API keys.
 * @param {cloudflareContext} ctx - The Cloudflare Workers execution context.
 * @param {Object} [config={}] - Configuration options for GAW behavior.
 * @param {string[]} [config.contentType=['text/html']] - Content types to process.
 * @param {string[]} [config.ignoreRoutes=[]] - Routes to exclude from GAW processing.
 * @param {string} [config.ignoreGawCookie='gaw'] - Cookie name to disable GAW for specific users.
 * @param {"latlon"|"country"} [config.locationType='latlon'] - Type of location data to use.
 * @param {Object} [config.htmlChanges=null] - An object to capture the different HTML changes that are applied at each different grid intesity level.
 * @param {Object} [config.htmlChanges.low=null] - Custom HTMLRewriter for page modification at low grid intensity level.
 * @param {Object} [config.htmlChanges.moderate=null] - Custom HTMLRewriter for page modification at moderate grid intensity level.
 * @param {Object} [config.htmlChanges.high=null] - Custom HTMLRewriter for page modification at high grid intensity level.
 * @param {string} [config.gawDataApiKey=''] - API key for the data source.
 * @param {boolean} [config.kvCacheData=false] - Whether to cache grid data in KV store.
 * @param {boolean} [config.kvCachePage=false] - Whether to cache modified pages in KV store.
 * @param {"none"|"full"|"headers"|"logs"} [config.debug="none"] - Activates debug mode which outputs logs and returns additional response headers.
 * @param {boolean} [config.devMode=false] - Whether to enable development mode.
 * @param {Object} [config.devConfig=null] - Configuration for development mode.
 * @param {string} [config.devConfig.hostname=''] - Hostname for development mode.
 * @param {string} [config.devConfig.port=''] - Port for development mode.
 * @param {string} [config.devConfig.protocol=''] - Protocol for development mode.
 * @returns {Promise<Response>} A modified or unmodified response based on grid data and configuration.
 * @example
 * // Basic usage in a Cloudflare Worker
 * export default {
 *   async fetch(request, env, ctx) {
 *     return auto(request, env, ctx, {
 *         gawDataApiKey: 'your-api-key'
 *     });
 *   }
 * };
 */
async function auto(request, env, ctx, config = {}) {
  const debug = config?.debug || "none";
  let debugHeaders = {};

  try {
    const contentType = config?.contentType || ["text/html"];
    const ignoreRoutes = config?.ignoreRoutes || [];
    const ignoreGawCookie = config?.ignoreGawCookie || "gaw-ignore";
    const htmlChanges = config?.htmlChanges || {};
    const locationType = config.locationType || "latlon";
    const devMode = config.dev || false;
    const devConfig = config.devConfig || {};
    // We set this as an options object so that we can add keys to it later if we want to expand this function
    const gawOptions = {};
    gawOptions.apiKey = config?.gawDataApiKey || "";

    let newRequest = null;
    if (devMode) {
      console.log("Dev mode enabled");
      const url = new URL(request.url);
      url.hostname = devConfig.hostname || "localhost";
      url.port = devConfig.port || "8080";
      url.protocol = devConfig.protocol || "http";
      newRequest = new Request(url.toString(), request);
    }

    if (newRequest) {
      request = newRequest;
    }

    const url = request.url;

    // If the route we're working on is on the ignore list, bail out as well
    ignoreRoutes.forEach((route) => {
      if (url.includes(route)) {
        // @ts-ignore
        return fetch(request);
      }
    });

    const response = await fetch(request.url);
    const contentTypeHeader = response.headers.get("content-type");

    // Then check if the request content type is HTML.
    // If the content is not HTML, then return the response without any changes.
    if (!contentTypeHeader) {
      if (debug === "full" || debug === "headers") {
        debugHeaders = { ...debugHeaders, "gaw-applied": "no-content-type" };
      }
      return new Response(response.body, {
        ...response,
        headers: {
          ...response.headers,
          "Content-Encoding": "gzip",
          ...debugHeaders,
        },
      });
    }

    // Check if the content type is in the list of content types to modify
    const isContentTypeValid = contentType.some((type) =>
      contentTypeHeader.toLowerCase().includes(type.toLowerCase()),
    );

    if (!isContentTypeValid) {
      if (debug === "full" || debug === "logs") {
        // If none of the content types match, return the response without changes.
        console.log(
          "Content type is not in the list, returning response as is",
          url,
          contentTypeHeader,
          contentType,
        );
      }

      if (debug === "full" || debug === "headers") {
        debugHeaders = { ...debugHeaders, "gaw-applied": "skip-content-type" };
      }

      return new Response(response.body, {
        ...response,
        headers: {
          ...response.headers,
          "Content-Type": contentTypeHeader,
          "Content-Encoding": "gzip",
          ...debugHeaders,
        },
      });
    }

    // We use a cookie to allow us to manually disable the grid-aware feature.
    // This is useful for testing purposes. It can also be used to disable the feature for specific users.
    const requestCookies = request.headers.get("cookie");

    let rewriter = null;
    if (requestCookies && requestCookies.includes("gaw-manual-view")) {
      if (requestCookies.includes("gaw-manual-view=low")) {
        rewriter = htmlChanges.low;
      } else if (requestCookies.includes("gaw-manual-view=moderate")) {
        rewriter = htmlChanges.moderate;
      } else if (requestCookies.includes("gaw-manual-view=high")) {
        rewriter = htmlChanges.high;
      }

      return new Response(rewriter.transform(response.clone()).body, {
        ...response,
        headers: {
          ...response.headers,
          "Content-Type": contentTypeHeader,
          "Content-Encoding": "gzip",
          ...debugHeaders,
        },
      });
    }

    if (requestCookies && requestCookies.includes(ignoreGawCookie)) {
      if (debug === "full" || debug === "headers") {
        debugHeaders = { ...debugHeaders, "gaw-applied": "skip-cookie" };
      }
      return new Response(response.body, {
        ...response,
        headers: {
          ...response.headers,
          "Content-Encoding": "gzip",
          ...debugHeaders,
        },
      });
    }

    // Get the location of the user
    const location = await getLocation(request, {
      mode: locationType,
    });

    const { lat, lon, country } = location;

    // If the country data does not exist, then return the response without any changes.
    if (!country && (!lat || !lon)) {
      if (debug === "full" || debug === "headers") {
        debugHeaders = { ...debugHeaders, "gaw-applied": "no-location-found" };
      }

      if (debug === "full" || debug === "logs") {
        console.log("No location found.");
      }
      return new Response(response.body, {
        ...response,
        headers: {
          ...response.headers,
          "Content-Encoding": "gzip",
          ...debugHeaders,
        },
      });
    }

    if (lat && lon) {
      if (debug === "full" || debug === "headers") {
        debugHeaders = {
          ...debugHeaders,
          "gaw-location": `lat: ${lat}, lon: ${lon}`,
        };
      }

      if (debug === "full" || debug === "logs") {
        console.log(`Location: lat: ${lat}, lon: ${lon}`);
      }
    } else {
      if (debug === "full" || debug === "headers") {
        debugHeaders = { ...debugHeaders, "gaw-location": `${country}` };
      }

      if (debug === "full" || debug === "logs") {
        console.log(`Location: ${country}`);
      }
    }

    let gridData = {};

    if (config?.kvCacheData) {
      let cachedData = "";
      // Check if we have have cached grid data for the country
      if (lat && lon) {
        cachedData = await fetchDataFromKv(env, `${lat}_${lon}`);
      } else {
        cachedData = await fetchDataFromKv(env, country);
      }

      try {
        gridData = JSON.parse(cachedData);
      } catch {
        console.log("Error parsing KV data");
      }

      if (gridData?.status) {
        if (debug === "full" || debug === "logs") {
          console.log("Using data from KV");
        }

        if (debug === "full" || debug === "headers") {
          debugHeaders = { ...debugHeaders, "gaw-data-source": "workers-kv" };
        }
      }
    }

    // If no cached data, fetch it using the PowerBreakdown class
    if (!gridData?.status) {
      if (debug === "full" || debug === "logs") {
        console.log("Using data from API");
      }

      if (debug === "full" || debug === "headers") {
        debugHeaders = { ...debugHeaders, "gaw-data-source": "api" };
      }

      const options = {
        mode: "level",
        apiKey: env.EMAPS_API_KEY || gawOptions.apiKey,
      };

      const gridIntensity = new GridIntensity(options);
      if (lat && lon) {
        gridData = await gridIntensity.check({ lat, lon });
      } else {
        gridData = await gridIntensity.check(country);
      }

      // If there's an error getting data, return the web page without any modifications
      if (gridData && "status" in gridData && gridData.status === "error") {
        if (debug === "full" || debug === "headers") {
          debugHeaders = { ...debugHeaders, "gaw-applied": "error-grid-data" };
        }

        if (debug === "full" || debug === "logs") {
          console.log("Error getting grid data", gridData);
        }

        return new Response(response.body, {
          ...response,
          headers: {
            ...response.headers,
            "Content-Encoding": "gzip",
            ...debugHeaders,
          },
        });
      }

      if (config?.kvCacheData) {
        // Save the fresh data to KV for future use.
        // By default data is stored for 1 hour.
        if (lat && lon) {
          await saveDataToKv(env, `${lat}_${lon}`, JSON.stringify(gridData));
          console.log("saved latlon to kv");
        } else if (country) {
          await saveDataToKv(env, `${country}`, JSON.stringify(gridData));
          console.log("saved country to kv");
        }
      }
    }

    if (debug === "full" || debug === "headers") {
      debugHeaders = {
        ...debugHeaders,
        "gaw-applied": "auto",
        "gaw-grid-data": JSON.stringify(gridData),
        "gaw-location": JSON.stringify(location),
      };
    }

    if (config?.kvCachePage) {
      // First, check if we've already got a cached response for the request URL. We do this using the Cloudflare Workers plugin.
      const cachedResponse = await fetchPageFromKv(
        env,
        `${gridData.level}_${request.url}`,
      );
      // If there's a cached response, return it with the additional headers.
      if (debug === "full" || debug === "logs") {
        console.log("Using cached page from KV");
      }

      if (debug === "full" || debug === "headers") {
        debugHeaders = { ...debugHeaders, "gaw-page-source": "workers kv" };
      }

      if (cachedResponse) {
        return new Response(cachedResponse, {
          ...response,
          headers: {
            ...response.headers,
            "Content-Encoding": "gzip",
            "Content-Type": contentTypeHeader,
            ...debugHeaders,
          },
        });
      }
    }

    // If there's no cached response, we'll modify the HTML page.

    if (gridData.level === "low" && htmlChanges.low) {
      rewriter = htmlChanges.low;
      rewriter.on("gaw-info-bar", {
        element(element) {
          element.setAttribute("data-gaw-level", "low");
          element.setAttribute("data-gaw-location", gridData.region);
        },
      });
    } else if (gridData.level === "moderate" && htmlChanges.moderate) {
      rewriter = htmlChanges.moderate;
      rewriter.on("gaw-info-bar", {
        element(element) {
          element.setAttribute("data-gaw-level", "moderate");
          element.setAttribute("data-gaw-location", gridData.region);
        },
      });
    } else if (gridData.level === "high" && htmlChanges.high) {
      rewriter = htmlChanges.high;
      rewriter.on("gaw-info-bar", {
        element(element) {
          element.setAttribute("data-gaw-level", "high");
          element.setAttribute("data-gaw-location", gridData.region);
        },
      });
    }

    if (rewriter) {
      if (debug === "full" || debug === "logs") {
        console.log("Using HTMLRewriter");
      }

      const gawResponse = new Response(
        rewriter.transform(response.clone()).body,
        {
          ...response,
          headers: {
            ...response.headers,
            "Content-Type": contentTypeHeader,
            "Content-Encoding": "gzip",
            ...debugHeaders,
          },
        },
      );

      if (config?.kvCachePage) {
        // Store the modified response in the KV for 24 hours
        // We'll use the Cloudflare Workers plugin to perform this action. The plugin sets an expirationTtl of 24 hours by default, but this can be changed
        await savePageToKv(
          env,
          `${gridData.level}_${request.url}`,
          gawResponse.clone(),
        );

        return gawResponse;
      }

      return gawResponse;
    }

    if (debug === "full" || debug === "headers") {
      debugHeaders = { ...debugHeaders, "gaw-applied": "no-grid-aware" };
    }

    // If the gridAware value is set to false, then return the response as is.
    return new Response(response.clone().body, {
      ...response,
      headers: {
        ...response.headers,
        "Content-Encoding": "gzip",
        ...debugHeaders,
      },
    });
  } catch (e) {
    console.log("Error in grid-aware auto function", e);
    // If there's an error getting data, return the web page without any modifications
    // console.log('Error getting grid data', e);
    if (debug === "full" || debug === "headers") {
      debugHeaders = {
        ...debugHeaders,
        ...debugHeaders,
        "gaw-applied": "error-failed",
      };
    }

    // @ts-ignore
    const errorResponse = await fetch(request);
    return new Response(errorResponse.body, {
      ...errorResponse,
      headers: {
        ...errorResponse.headers,
        "Content-Encoding": "gzip",
        ...debugHeaders,
      },
    });
  }
}

export default auto;
export {
  getLocation,
  savePageToKv,
  fetchPageFromKv,
  saveDataToKv,
  fetchDataFromKv,
};
