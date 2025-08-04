# Grid-aware Websites - Cloudflare Workers Plugin

This plugin provides some useful functions that can be used when setting up the [`@greenweb/grid-aware websites`](https://github.com/thegreenwebfoundation/grid-aware-websites/README.md) library using [Cloudflare Workers](https://workers.cloudflare.com/).

## Quickstart

The easiest way to use this plugin is by utilising the `gridAwareAuto` functionality that it provides. As a minimum, you would need to have the below code in your Cloudflare Worker.

Install this library in your project using `npm install @greenweb/gaw-plugin-cloudflare-workers`.

> ![NOTE] To use this function you also need to have a valid [Electricity Maps API](https://portal.electricitymaps.com/) key with access to the [Carbon Aware Websites API](https://portal.electricitymaps.com/developer-hub/api/reference#latest-carbon-intensity-level). This function currently uses that API as the source of grid intensity data. The Carbon Aware Websites API is currently only available under a paid plan, but we are in conversation with Electricity Maps on ways to make this data available in some kind of free version. You can track the progress and express your interest in this API [in this issue](https://github.com/thegreenwebfoundation/grid-aware-websites/issues/21).

Replace your Cloudflare Worker with the following code.

```js
import gridAwareAuto from "@greenweb/gaw-plugin-cloudflare-workers";

export default {
  async fetch(request, env, ctx) {
    return gridAwareAuto(request, env, ctx);
  },
};
```

This code will:

1. Get the request location.
2. Fetch the current relative grid intensity using the [Electricity Maps API](https://portal.electricitymaps.com/).
3. Return the page to the user.

The `gridAwareAuto` function also accepts an options object as the fourth parameter. This allows for some configuration to be made to the implementation. Accepted options values are:

| Option                  | Type         | Default         | Possible values                                                            | Description                                                                                                       |
| ----------------------- | ------------ | --------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `contentType`           | String[]     | `['text/html']` | Example: ['text/html', 'text/css']                                         | Defines the content types that should be processed                                                                |
| `ignoreRoutes`          | String[]     | `[]`            | Example: ['/wp-admin', '/assets/js']                                       | A list of routes where grid-aware code should not be applied                                                      |
| `ignoreGawCookie`       | String       | `'gaw-ignore'`  | "gaw-ignore"                                                               | A cookie that when present will result in grid-aware code being skipped                                           |
| `userOptIn`             | Boolean      | `false`         | true, false                                                                | Allows developers to specify if users are required to opt-in to the grid-aware website experience                 |
| `locationType`          | String       | `'latlon'`      | "latlon", "country"                                                        | Type of location data to use                                                                                      |
| `htmlChanges`           | Object       | {}              | {"low": HTMLRewriter, "moderate": HTMLRewriter, "high": HTMLRewriter}      | An object to capture the different HTML changes that are applied at each different grid intesity level            |
| `htmlChanges.low`       | HTMLRewriter | null            | Custom HTMLRewriter for page modification at low grid intensity level      |
| `htmlChanges.moderate`  | HTMLRewriter | null            | Custom HTMLRewriter for page modification at moderate grid intensity level |
| `htmlChanges.high`      | HTMLRewriter | null            | Custom HTMLRewriter for page modification at high grid intensity level     |
| `defaultView`           | String/null  | `null`          | null, "low", "moderate", "high"                                            | Default view for the grid-aware website experience                                                                |
| `gawDataApiKey`         | String       | `''`            | "xyz123"                                                                   | API key for the data source                                                                                       |
| `infoBar`               | Object       | `{}`            | `{target: "", version: "latest", learnMoreLink: "#", popoverText: ""}`     | Configuration for the info bar element                                                                            |
| `infoBar.target`        | String       | `''`            | Example: "header", "#info-container"                                       | Target element for the info bar                                                                                   |
| `infoBar.version`       | String       | `'latest'`      | "latest", "1.0.0"                                                          | Version of the info bar to use                                                                                    |
| `infoBar.learnMoreLink` | String       | `'#'`           | Example: "https://example.com/learn-more"                                  | Link to learn more about the info bar                                                                             |
| `infoBar.popoverText`   | String       | `''`            | Example: "This website adapts based on carbon intensity"                   | Provide a custom string of text to be used in the info bar popover element                                        |
| `kvCacheData`           | Boolean      | `false`         | true, false                                                                | Whether to cache grid data in KV store. Read [setup instructions](#cache-grid-data-in-cloudflare-workers-kv)      |
| `kvCachePage`           | Boolean      | `false`         | true, false                                                                | Whether to cache modified pages in KV store. Read [setup instructions](#cache-grid-data-in-cloudflare-workers-kv) |
| `debug`                 | String       | "none"          | "none", "full", "headers", "logs"                                          | Activates debug mode which outputs logs and returns additional response headers                                   |
| `dev`                   | Boolean      | `false`         | true, false                                                                | Whether to enable development mode                                                                                |
| `devConfig`             | Object       | `{}`            | `{hostname: "localhost", port: "8080", protocol: "http"}`                  | Configuration for development mode                                                                                |

The following example will run on all HTML pages, but will skip any routes (URLs) that include the `/company/` or `/profile/` strings. It will use Electricity Maps as the data source, and uses an API key which has been set as an environment secret. IF grid-aware changes need to be applied to the page, a `data-grid-aware=true` attribute will be set on the HTML element.

```js
import gridAwareAuto from "@greenweb/gaw-plugin-cloudflare-workers";

export default {
  async fetch(request, env, ctx) {
    return gridAwareAuto(request, env, ctx, {
      // Ignore these routes
      ignoreRoutes: ["/company/", "/profile/"],
      // Use this API key that has been saved as a secret
      gawDataApiKey: env.EMAPS_API_KEY,
      // Configure the grid-aware info bar
      infoBar: {
        target: "#gaw-info-bar",
        learnMoreLink:
          "https://www.thegreenwebfoundation.org/tools/grid-aware-websites/",
        version: "latest",
        popoverText:
          "This website adapts based on your local electricity grid's carbon intensity",
      },
      // Require users to opt-in to grid-aware experience
      userOptIn: false,
      // Set a default view (null means it will be based on actual grid intensity)
      defaultView: null,
      // Make these changes to the web page using HTMLRewriter when the grid intensity is high.
      // All other states (low, moderate) will return the page as normal - no changes applied.
      htmlChanges: {
        high: new HTMLRewriter().on("html", {
          element(element) {
            element.setAttribute("data-grid-aware", "true");
          },
        }),
      },
    });
  },
};
```

### See this in the wild

We use this function on our own Green Web Foundation Grid-aware Websites project page.

- View [Grid-aware Websites project page](https://www.thegreenwebfoundation.org/tools/grid-aware-websites/) | [Cloudflare Workers source code](https://github.com/thegreenwebfoundation/gwf-gaw-cloudflare-worker/blob/main/src/index.js)
- View [Branch website](https://branch.climateaction.tech/) | [Cloudflare Workers source code](https://github.com/thegreenwebfoundation/branch-gaw-worker)

---

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
      return new Response("There was an error");
    }

    // Otherwise we can get the "country" variable
    const { country } = location;
    return new Response(`The country is ${country}.`);
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
      mode: "latlon",
    });

    // If there's an error, process the request as normal
    if (location.status === "error") {
      return new Response("There was an error");
    }

    // Otherwise we can get the "latlon" object
    const { lat, lon } = location;
    return new Response(`The country is ${JSON.stringify({ lat, lon })}.`);
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
