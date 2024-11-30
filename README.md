# Grid-aware Websites - Cloudflare Workers Plugin

This plugin provides some useful functions that can be used when setting up the [`@greenweb/grid-aware websites`](/thegreenwebfoundation/grid-aware-websites/README.md) library using [Cloudflare Workers](https://workers.cloudflare.com/).

After you have installed the `@greenweb/grid-aware-websites` package ([see steps](/thegreenwebfoundation/grid-aware-websites/README.md)), you can use this plugin to:

- Fetch the location of a user based on `cf` header values that are sent along in each Cloudflare request.

## Fetching location (`getLocation()`)

The code below is a simplified demonstation of how to use this plugin to fetch the request location, and then use it with the `gridAwarePower` function.

The worker code below will return the grid data back to the browser in JSON format.

```js
import { gridAwarePower } from "@greenweb/grid-aware-websites";
import { getLocation } from "@greenweb/gaw-plugin-cloudflare-workers";

export default {
  async fetch(request, env, ctx) {
    const cfData = getLocation(request);
    const { country } = cfData;

    const gridData = await gridAwarePower(country, "API_KEY");

    return new Response(gridData);
  },
};
```

By default, the `getLocation()` function returns the `request.cf.country` header. However, it can also be used to return the `request.cf.latitude` and `request.cf.longitude` headers if desired.

```js
import { gridAwarePower } from "@greenweb/grid-aware-websites";
import { getLocation } from "@greenweb/gaw-plugin-cloudflare-workers";

export default {
  async fetch(request, env, ctx) {
    const cfData = getLocation(request, {
      mode: "latlon",
    });

    const { lat, lon } = cfData;

    // Functionality yet to be built into grid-aware-websites library.
  },
};
```

> [!NOTE]
> Using latitude and longitude values is not yet supported in the `@greenweb/grid-aware-websites` package.
