# Grid-aware Websites - Cloudflare Workers Plugin

This plugin provides some useful functions that can be used when setting up the [`@greenweb/grid-aware websites`](/thegreenwebfoundation/grid-aware-websites/README.md) library using [Cloudflare Workers](https://workers.cloudflare.com/).

After you have installed the `@greenweb/grid-aware-websites` package ([see steps](/thegreenwebfoundation/grid-aware-websites/README.md)), you can use this plugin to:

- Fetch the location of a user based on `cf` header values that are sent along in each Cloudflare request.

## Fetching location

The core functionality of this library is to provide a means for users to fetch user location data from Cloudflare requests, so that data can then be used in the `@greenweb/grid-aware-websites` library.

### Fetch user country (default)

The worker code below will return the grid data back to the browser in JSON format.

```js
import { getLocation } from "@greenweb/gaw-plugin-cloudflare-workers";

export default {
  async fetch(request, env, ctx) {
    const cfData = getLocation(request);

    if (!status === "error") {
      const { country } = cfData;
      // ... other grid-aware websites code.
    }

  },
};
```

### Fetch user latlon

By default, the `getLocation()` function returns the `request.cf.country` header. However, it can also be used to return the `request.cf.latitude` and `request.cf.longitude` headers if desired.

```js
import { getLocation } from "@greenweb/gaw-plugin-cloudflare-workers";

export default {
  async fetch(request, env, ctx) {
    const cfData = getLocation(request, {
      mode: "latlon",
    });

    if (!status === "error") {
      const { lat, lon } = cfData;
     // Functionality yet to be built into grid-aware-websites library.
    }

  },
};
```

> [!NOTE]
> Using latitude and longitude values is not yet supported in the `@greenweb/grid-aware-websites` package.

## Additional functionality

In addition to the core functionality, we have included other convenience functions in this library to provide consistent methods for developers to use other Cloudflare features. These aim to help reduce API requests, and return cached page results.

### Cache grid data in Cloudflare Workers KV

The `@greenweb/grid-aware-websites` library relies on fetching data from third-party APIs to get near-live data about a specific location's energy grid. These requests can have a cost - both in time, and maybe also financially depending on how many we're making.

To reduce the number out outbound calls to third-party data APIs, we can cache results in Cloudflare Workers KV (key-value) stores for a specified period of time. We expose two functions which allow results to be saved to KV and fetched from KV.

#### Data KV Setup

To setup saving grid data to Cloudflare Workers KV, you will need to create a KV namespace and bind it to your project. In your Workers project, run the following command and follow the returned instructions to bind the KV namespace to your project.

```bash
npx wrangler kv namespace create GAW_DATA_KV
```

### Cache page response in Cloudflare Workers KV

The Grid-aware Websites project encourages developers to return modified pages to users when grid-awareness is applied. These pages should "do less" in terms of running JavaScript and other processor intensive operations.

Rather than generate these modified pages on each request, they can be cached in a KV store for a specified period of time. This reduces the need to recompute these pages, and returns them to the user sooner - even when grid-aware changes are applied.

#### Page KV Setup

To setup saving pages to Cloudflare Workers KV, you will need to create a KV namespace and bind it to your project. In your Workers project, run the following command and follow the returned instructions to bind the KV namespace to your project.

```bash
npx wrangler kv namespace create GAW_PAGE_KV
```

## Putting it all together

The below code is an example of a Cloudflare Worker that:

- Gets a user's country location
- Checks for location data in the KV store
- If no data is found, fetch live data using `@green/grid-aware-websites`
- If `gridAware: true`:
  - Check the page KV store for a modified page.
  - Either return the cached page, or modify the page using `HTMLRewriter` and cache the result before returing the page.
- If `gridAware: false`:
  - Return an unmodified page.

```js
import { gridAwarePower } from '@greenweb/grid-aware-websites'
import { getLocation, saveDataToKv, fetchDataFromKv, savePageToKv, fetchPageFromKv } from '@greemweb/gaw-plugin-cloudflare-workers'

export default {
  async fetch(request, env, ctx) {
    const response = await fetch(request.url);
    const contentType = response.headers.get('content-type');

    // Check if the content type is HTML. If not, return the response as is.
    if (!contentType || !contentType.includes('text/html')) {
      return new Response(response.body, {
        ...response,
      });
    }
    const cfData = getLocation(request);
    const { country } = cfData;

    // First check if the there's data for the country saved to KV
    let gridData = await fetchDataFromKv(env, country);

    // If no cached data, fetch it using `@greenweb/grid-aware-power`
    if (!gridData) {
      try {
        gridData = await gridAwarePower(country, "API_KEY");
      } catch {
          return new Response(response.body, {
            ...response,
          });
      }
    }

    // Save the gridData to the KV store. By default, data is cached for 1 hour, but that can be changed.
    await saveDataToKv(env, country, JSON.stringify(gridData), {
      expirationTtl: 60 * 60 * 2; // Cache the data for 2 hours instead.
    })

    // If the gridAware value is set to true, then let's modify the page
    if (gridData.gridAware) {
      // Check if the response is already stored in KV
      const cachedResponse = await fetchPageFromKv(env, request.url);

      // If there's a cached response, return that
      if (cachedResponse) {
        return new Response(cachedResponse, {
          ...response,
          headers: {
            ...response.headers,
            'Content-Type': 'text/html;charset=UTF-8',
          }
        });
      }

      // Otherwise, let's modify the page using HTMLRewriter. 
      // In this example, we just add a "grid-aware" class to the body tag.
      let gridAwarePage = response
      const modifyHTML = new HTMLRewriter().on('body', {
        element(element) {
          element.setAttribute('class', 'grid-aware');
        },
      });

      let modifiedResponse = new Response(modifyHTML.transform(gridAwarePage).body, {
        ...gridAwarePage,
        headers: {
          ...gridAwarePage.headers,
          'Content-Type': 'text/html;charset=UTF-8',
        },
      });


      // Store the modified response in the KV. By default, data is cached for 24 hours, but that can be changed.
      await savePageToKv(env, request.url, modifiedResponse.clone(), {
        expirationTtl: 60 * 60 * 48; // Store the page for 2 days (48 hours) instead
      });

      return modifiedResponse;
    }

    // If the gridAware value is set to false, then return the response as is.
    return new Response(response.body, {
      headers: {
        ...response.headers,
        'Content-Type': 'text/html;charset=UTF-8',
      },
    });
  };
};
```
