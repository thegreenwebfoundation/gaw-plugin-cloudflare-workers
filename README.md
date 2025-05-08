# Grid-aware Websites - Cloudflare Workers Plugin

This plugin provides some useful functions that can be used when setting up the [`@greenweb/grid-aware websites`](/thegreenwebfoundation/grid-aware-websites/README.md) library using [Cloudflare Workers](https://workers.cloudflare.com/).

## Quickstart

The easiest way to use this plugin is by utilising the `auto` functionality that it provides. As a minimum, you would need to have the below code in your Cloudflare Worker.

```js
import auto from '@greenweb/gaw-plugin-cloudflare-workers';

export default {
 async fetch(request, env, ctx) {
  return auto(request, env, ctx);
 },
};
```

This code will:

1. Get the request location.
2. Run the grid-aware logic using the `PowerBreakdown` API.
3. Return the page regardless of the results.

The `auto` function also accepts an options object as the fourth parameter. This allows for some configuration to be made to the implementation. Accepted options values are:

Here's the option formatted as a markdown table:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `contentType` | String[] | `['text/html']` | Defines the content types that should be processed |
| `ignoreRoutes` | String[] | `[]` | A list of routes where grid-aware code should not be applied |
| `ignoreGawCookie` | String | `'gaw-ignore'` | A cookie that when present will result in grid-aware code being skipped |
| `locationType` | String `'country|'latlon'` | `'country'` | Indicates the geolocation data to use for grid-aware checks. |
| `htmlChanges` | HTMLRewriter | `null` | HTMLRewriter functions which can be used to make adjustments to the page when grid-aware changes need to be appplied. |
| `gawDataSource` | String | `'electricity maps'` | The data source to use from the core [Grid-aware Websites](https://github.com/thegreenwebfoundation/grid-aware-websites?tab=readme-ov-file#working-with-this-library) library. |
| `gawDataApiKey` | String | `''` | The API key (if any) for the chosen data source. |
| `gawDataType` | String | `'power'` | The data type to use from the core Grid-aware Websites library. |
| `kvCacheData` | Boolean | `false` | Indicate if grid data from the API should be cached in Cloudflare Workers KV for one hour. Read [setup instructions](#cache-grid-data-in-cloudflare-workers-kv). |
| `kvCachePage` | Boolean | `false` | Indicates if the modified grid-aware page should be cached in Cloudflare Workers KV for 24 hours. Read [setup instructions](#cache-grid-data-in-cloudflare-workers-kv) |

The following example will run on all HTML pages, but will skip any routes (URLs) that include the `/company/` or `/profile/` strings. It will use Electricity Maps as the data source, and uses an API key which has been set as an environment secret. IF grid-aware changes need to be applied to the page, a `data-grid-aware=true` attribute will be set on the HTML element.

```js
import auto from '@greenweb/gaw-plugin-cloudflare-workers';

export default {
 async fetch(request, env, ctx) {
  return auto(request, env, ctx, {
    ignoreRoutes: ['/company/`, `/profile/`],
    gawDataApiKey: env.EMAPS_API_KEY,
    htmlChanges: new HTMLRewriter().on('html', {
      element(element) {
      element.setAttribute('data-grid-aware', 'true');
      },
    }),
  });
 },
};

```

## Advanced

If you want to have more control over how grid-awareness is applied to your site, you can use this plugin in conjunction with the core [Grid-aware Websites](https://github.com/thegreenwebfoundation/grid-aware-websites) library.

First, install the Grid-aware Websites library ([see steps](/thegreenwebfoundation/grid-aware-websites/README.md)). After you have installed the `@greenweb/grid-aware-websites` package, you can use this plugin to:

- Fetch the location of a user based from the Cloudflare request.

### Fetching location

The core functionality of this library is to provide a means for users to fetch user location data from Cloudflare requests, so that data can then be used in the `@greenweb/grid-aware-websites` library.

#### Fetch request country (default)

The worker code below will return the grid data back to the browser in JSON format.

```js
import { getLocation } from "@greenweb/gaw-plugin-cloudflare-workers";

export default {
  async fetch(request, env, ctx) {

    // Use the getLocation function to check for the user's country in the request object
    const location = getLocation(request);

    // If there's an error, process the request as normal
    if (location.status === "error") {
        return new Response('There was an error');
    }

    // Otherwise we can get the "country" variable 
    const { country } = location;
    return new Response(`The country is ${country}.`)
  },
};
```

#### Fetch request latlon

By default, the `getLocation()` function returns the country of the request. However, it can also be used to return the latitude and longitude values if desired.

```js
import { getLocation } from "@greenweb/gaw-plugin-cloudflare-workers";

export default {
  async fetch(request, env, ctx) {

    // Use the getLocation function to check for the user's latlon in the request object
    const location = getLocation(request, {
      mode: "latlon"
    });

    // If there's an error, process the request as normal
    if (location.status === "error") {
        return new Response('There was an error');
    }

    // Otherwise we can get the "latlon" object 
    const { lat, lon } = location;
    return new Response(`The country is ${JSON.stringify({lat, lon})}.`)
  },
};
```

> [!NOTE]
> Using latitude and longitude values is not yet supported in the `@greenweb/grid-aware-websites` package.

### Additional functionality

In addition to the core functionality, we have included other convenience functions in this library to provide consistent methods for developers to use other Cloudflare features. These aim to help reduce API requests, and return cached page results.

#### Cache grid data in Cloudflare Workers KV

The `@greenweb/grid-aware-websites` library relies on fetching data from third-party APIs to get near-live data about a specific location's energy grid. These requests can have a cost - both in time, and maybe also financially depending on how many we're making.

To reduce the number out outbound calls to third-party data APIs, we can cache results in Cloudflare Workers KV (key-value) stores for a specified period of time. We expose two functions which allow results to be saved to KV and fetched from KV.

##### Data KV Setup

To setup saving grid data to Cloudflare Workers KV, you will need to create a KV namespace and bind it to your project. In your Workers project, run the following command and follow the returned instructions to bind the KV namespace to your project.

```bash
npx wrangler kv namespace create GAW_DATA_KV
```

#### Cache page response in Cloudflare Workers KV

The Grid-aware Websites project encourages developers to return modified pages to users when grid-awareness is applied. These pages should "do less" in terms of running JavaScript and other processor intensive operations.

Rather than generate these modified pages on each request, they can be cached in a KV store for a specified period of time. This reduces the need to recompute these pages, and returns them to the user sooner - even when grid-aware changes are applied.

##### Page KV Setup

To setup saving pages to Cloudflare Workers KV, you will need to create a KV namespace and bind it to your project. In your Workers project, run the following command and follow the returned instructions to bind the KV namespace to your project.

```bash
npx wrangler kv namespace create GAW_PAGE_KV
```

### Putting it all together

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
    const location = getLocation(request);
    const { country } = location;

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

    if(gridData.status === "success") {
      // Save the gridData to the KV store. By default, data is cached for 1 hour, but that can be changed.
      await saveDataToKv(env, country, JSON.stringify(gridData), {
        expirationTtl: 60 * 60 * 2; // Cache the data for 2 hours instead.
      })
    }

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
