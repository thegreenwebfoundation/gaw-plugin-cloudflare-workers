import { PowerBreakdown, GridIntensity } from '@greenweb/grid-aware-websites';


/**
 * Type definitions
 * @typedef {import('./types').cloudflareRequest} cloudflareRequest The incoming request object.
 * @typedef {import('./types').locationOptions} locationOptions Additional options for the function.
 * @typedef {import('./types').locationResponse} locationResponse The location of the user.
 * @typedef {import('./types').cloudflareResponse} cloudflareResponse The response object to save.
 * @typedef {import('./types').cloudflareEnv} cloudflareEnv Cloudflare environment.
 * @typedef {import('./types').kvOptions} kvOptions Additional options for the function.
 */

// import { HTMLRewriter } from '@cloudflare/workers-types';

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
 * @param {kvOptions} [options] Additional options for the function.\
 * @returns {Promise<void>}
 * @example
 * savePageToKv(env, "https://example.com/page", response);
 */ 
 async function savePageToKv(env, key, response, options) {
  let expirationTtl = 60 * 60 * 24;

  if(options?.expirationTtl && typeof options?.expirationTtl === 'number') {
    expirationTtl = options.expirationTtl;
  }

  try {
    const responseBody = response.body;
    await env.GAW_PAGE_KV.put(key, responseBody, { expirationTtl });
    return Promise.resolve()
  } catch (error) {
    return Promise.reject()
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

  if(options?.expirationTtl && typeof options?.expirationTtl === 'number') {
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

// The purpose of this function is to allow for an easier implementation of GAW on Cloudflare.
// The config contains all the params, and options that the can set
async function auto(request, env, ctx, config = {}) {
  // Config can include
  // - contentType (default: ['text/html'])
  // - ignoreRoutes (default: [])
  // - ignoreGawCookie (default: 'gaw')
  // - locationType (default: 'country')
  // - htmlChanges (default: null)
  // - gawOptions.source: (default: 'electricity maps')
  // - gawOptions.type: (default: 'power')
  // - gawOptions.apiKey (default: '')
  // - useKV.cacheData (default: false)
  // - useKV.cachePage (default: false)

  const contentType = config?.contentType || ['text/html'];
  const ignoreRoutes = config?.ignoreRoutes || [];
  const ignoreGawCookie = config?.ignoreGawCookie || 'gaw-ignore'
  const htmlChanges = config?.htmlChanges || null;
  const gawOptions = {}

  gawOptions.source = config?.gawDataSource?.toLowerCase() || 'electricity maps'
  gawOptions.type = config?.gawDataType?.toLowerCase() || 'power'
  
  if (gawOptions.type === 'power') {
    gawOptions.mode = 'low-carbon';
  } else if (gawOptions.type === 'carbon') {
    gawOptions.mode = 'limit'
  }

  gawOptions.apiKey = config?.gawDataApiKey || ''


  // This would be used inside a Cloudflare worker, so we expect the request and evn to be available.
  const url = request.url;
  const response = await fetch(request.url);
  const contentTypeHeader = response.headers.get('content-type');

  // console.log({config, gawOptions})

  // Then check if the request content type is HTML.
  // If the content is not HTML, then return the response without any changes.
  if(!contentTypeHeader) {
    return new Response(response.body, {
      ...response,
      headers: {
        ...response.headers,
        "Content-Encoding": "gzip",
        "gaw-applied": "no-content-type",
      }
    });
  }

  
  // Check if the content type is in the list of content types to modify
  const isContentTypeValid = contentType.some(type =>
    contentTypeHeader.toLowerCase().includes(type.toLowerCase())
  );
  
  // console.log(url, 'Content type header', contentTypeHeader, contentType, 'isContentTypeValid', isContentTypeValid);

  if (!isContentTypeValid) {
    // If none of the content types match, return the response without changes.
    console.log('Content type is not in the list, returning response as is', url, contentTypeHeader, contentType);
    return new Response(response.body, {
      ...response,
      headers: {
        ...response.headers,
        "Content-Type": contentTypeHeader,
        "Content-Encoding": "gzip",
        "gaw-applied": "skip-content-type"
      }
    });
  }

  // If the route we're working on is on the ignore list, bail out as well
  ignoreRoutes.forEach(route => {
    if (url.includes(route)) {
      return new Response(response.body, {
        ...response,
        headers: {
          ...response.headers,
          "Content-Encoding": "gzip",
          "gaw-applied": "skip-route"
        }
      });
    }
  });

  // We use a cookie to allow us to manually disable the grid-aware feature.
  // This is useful for testing purposes. It can also be used to disable the feature for specific users.
  const requestCookies = request.headers.get('cookie');
  if (requestCookies && requestCookies.includes(ignoreGawCookie)) {
    return new Response(response.body, {
      ...response,
      headers: {
        ...response.headers,
        "Content-Encoding": "gzip",
        "gaw-applied": "skip-cookie"
      }
    });
  }

  try {
    // Get the location of the user
    const location = await getLocation(request);
    const { country } = location;

    // If the country data does not exist, then return the response without any changes.
    if (!country) {
      return new Response(response.body, {
        ...response,
        headers: {
          ...response.headers,
          "Content-Encoding": "gzip",
          "gaw-applied": "no-country"
        }
      });
    }

    let gridData = null;

    if (config?.kvCacheData) {
      // Check if we have have cached grid data for the country
			gridData = await fetchDataFromKv(env, country);
    }

    // If no cached data, fetch it using the PowerBreakdown class
    if (!gridData) {
      const options = {
        mode: gawOptions.mode,
        apiKey: env.EMAPS_API_KEY || gawOptions.apiKey,
      }
      
      // console.log(options);

      if (gawOptions.source === 'electricity maps') {
        if (gawOptions.type === 'power') {
          const powerBreakdown = new PowerBreakdown(options);
          // console.log('PowerBreakdown', powerBreakdown);
          gridData = await powerBreakdown.check(country);
        } else if (gawOptions.type === 'carbon') {
          const gridIntensity = new GridIntensity(options);
          gridData = await gridIntensity.check(country);
        }

        // If there's an error getting data, return the web page without any modifications
        if (gridData?.status === 'error') {
          // console.log('Error getting grid data', gridData);
          return new Response(response.body, {
            ...response,
            headers: {
              ...response.headers,
              "Content-Encoding": "gzip",
              "gaw-applied": "error-grid-data",
            },
          });
        }
      }

      if (config?.kvCacheData) {
        // Save the fresh data to KV for future use.
        // By default data is stored for 1 hour.
        await saveDataToKv(env, country, JSON.stringify(gridData));
      }
    } else {
      // Otherwise we're using cached data, so let's parse that
      gridData = await JSON.parse(gridData);
    }

    // console.log('Grid data', gridData, gridData.gridAware);


    // If the grid aware flag is triggered (gridAware === true), then we'll return a modified HTML page to the user.
    if (gridData.gridAware) {
      if (config?.kvCachePage) {
        // First, check if we've already got a cached response for the request URL. We do this using the Cloudflare Workers plugin.
        const cachedResponse = await fetchPageFromKv(env, request.url);
        // If there's a cached response, return it with the additional headers.
        if (cachedResponse) {
          return new Response(cachedResponse, {
            ...response,
            headers: {
              ...response.headers,
              "gaw-applied": "auto",				
              "Content-Encoding": "gzip",
              "Content-Type": contentTypeHeader,
              "gaw-grid-data": JSON.stringify(gridData),
              "gaw-location": JSON.stringify(location),
            },
          });
        }
      }

      // If there's no cached response, we'll modify the HTML page.
      // let rewriter = new HTMLRewriter().on('body', {
      //   element(element) {
      //     // This is where we can modify the HTML page. For now, we'll just add a comment to the body.
      //     element.append(`<!-- Grid Aware Webpage -->`, { html: true });
      //   }
      // });
      let rewriter = null;
      if (htmlChanges) {
        rewriter = htmlChanges
      }


      if (rewriter) {
        // console.log('Rewriter', rewriter);
      const gawResponse = new Response(rewriter.transform(response.clone()).body, {
        ...response,
        headers: {
          ...response.headers,
          "gaw-applied": "auto",
          'Content-Type': contentTypeHeader,
          'Content-Encoding': "gzip",
          "gaw-grid-data": JSON.stringify(gridData),
          "gaw-location": JSON.stringify(location),
        },
      })
      
      if (config?.kvCachePage) {
        // Store the modified response in the KV for 24 hours
        // We'll use the Cloudflare Workers plugin to perform this action. The plugin sets an expirationTtl of 24 hours by default, but this can be changed
        await savePageToKv(env, request.url, gawResponse.clone());
        return gawResponse;
      }

      return gawResponse;
    }
  }

    // If the gridAware value is set to false, then return the response as is.
    return new Response(response.clone().body, {
      ...response,
      headers: {
        ...response.headers,
        "Content-Encoding": "gzip",
        "gaw-applied": "no-grid-aware",
      }
    });
  } catch (e) {
    console.log('Error in auto function', e);
    // If there's an error getting data, return the web page without any modifications
    // console.log('Error getting grid data', e);
    return new Response(response.clone().clone().body, {
      ...response,
      headers: {
        ...response.headers,
        "Content-Encoding": "gzip",
        "gaw-applied": "error-failed",
      }
    });
  }
}


export default auto;
export { getLocation, savePageToKv, fetchPageFromKv, saveDataToKv, fetchDataFromKv };