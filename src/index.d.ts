export default auto;
/**
 * The incoming request object.
 */
export type cloudflareRequest = import("./types").cloudflareRequest;
/**
 * Additional options for the function.
 */
export type locationOptions = import("./types").locationOptions;
/**
 * The location of the user.
 */
export type locationResponse = import("./types").locationResponse;
/**
 * The response object to save.
 */
export type cloudflareResponse = import("./types").cloudflareResponse;
/**
 * Cloudflare environment.
 */
export type cloudflareEnv = import("./types").cloudflareEnv;
/**
 * Additional options for the function.
 */
export type kvOptions = import("./types").kvOptions;
/**
 * Cloudflare Workers ExecutionContext
 */
export type cloudflareContext = import("./types").cloudflareContext;
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
 * @param {boolean} [config.userOptIn=false] - Allows developers to specify if whether users are required to opt-in to the grid-aware website experience on their site.
 * @param {"latlon"|"country"} [config.locationType='latlon'] - Type of location data to use.
 * @param {Object} [config.htmlChanges=null] - An object to capture the different HTML changes that are applied at each different grid intesity level.
 * @param {Object} [config.htmlChanges.low=null] - Custom HTMLRewriter for page modification at low grid intensity level.
 * @param {Object} [config.htmlChanges.moderate=null] - Custom HTMLRewriter for page modification at moderate grid intensity level.
 * @param {Object} [config.htmlChanges.high=null] - Custom HTMLRewriter for page modification at high grid intensity level.
 * @param {null|'low'|'moderate'|'high'} [config.defaultView=null] - Default view for the grid-aware website experience.
 * @param {string} [config.gawDataApiKey=''] - API key for the data source.
 * @param {Object} [config.infoBar={}] - Configuration for the info bar element.
 * @param {string} [config.infoBar.target=''] - Target element for the info bar.
 * @param {string} [config.infoBar.version='latest'] - Version of the info bar to use.
 * @param {string} [config.infoBar.learnMoreLink='#'] - Link to learn more about the info bar.
 * @param {boolean} [config.kvCacheData=false] - Whether to cache grid data in KV store.
 * @param {boolean} [config.kvCachePage=false] - Whether to cache modified pages in KV store.
 * @param {"none"|"full"|"headers"|"logs"} [config.debug="none"] - Activates debug mode which outputs logs and returns additional response headers.
 * @param {boolean} [config.dev=false] - Whether to enable development mode.
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
declare function auto(request: cloudflareRequest, env: cloudflareEnv, ctx: cloudflareContext, config?: {
    contentType?: string[];
    ignoreRoutes?: string[];
    ignoreGawCookie?: string;
    userOptIn?: boolean;
    locationType?: "latlon" | "country";
    htmlChanges?: {
        low?: any;
        moderate?: any;
        high?: any;
    };
    defaultView?: null | "low" | "moderate" | "high";
    gawDataApiKey?: string;
    infoBar?: {
        target?: string;
        version?: string;
        learnMoreLink?: string;
    };
    kvCacheData?: boolean;
    kvCachePage?: boolean;
    debug?: "none" | "full" | "headers" | "logs";
    dev?: boolean;
    devConfig?: {
        hostname?: string;
        port?: string;
        protocol?: string;
    };
}): Promise<Response>;
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
/**
 * Get the location of the user from the request object.
 * @param {cloudflareRequest} request The incoming request object.
 * @param {locationOptions} [options] Additional options for the function.
 * @returns {locationResponse} The location of the user.
 */
export function getLocation(request: cloudflareRequest, options?: locationOptions): locationResponse;
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
export function savePageToKv(env: cloudflareEnv, key: string, response: Response, options?: kvOptions): Promise<void>;
/**
 * Fetch a page response from the KV store.
 * @param {cloudflareEnv} env Cloudflare environment.
 * @param {string} key The key to fetch the response from. We recommend using the URL as the key.
 * @return {Promise<string | Object | ArrayBuffer | ReadableStream | null>} The response object from the KV store.
 */
export function fetchPageFromKv(env: cloudflareEnv, key: string): Promise<string | any | ArrayBuffer | ReadableStream | null>;
/**
 * Save electricity data to a KV store.
 * @param {cloudflareEnv} env Cloudflare environment
 * @param {string} key The key to save the response under. We recommend using either the country code or lat-lon values
 * @param {string | ArrayBuffer | ArrayBufferView | import('@cloudflare/workers-types').ReadableStream} data The data to be saved
 * @param {kvOptions} [options] Additional options for the function
 * @return {Promise<void>}
 */
export function saveDataToKv(env: cloudflareEnv, key: string, data: string | ArrayBuffer | ArrayBufferView | import("@cloudflare/workers-types").ReadableStream, options?: kvOptions): Promise<void>;
/**
 * Fetch electricity data from a KV store.
 * @param {cloudflareEnv} env Cloudflare environment.
 * @param {string} key The key to fetch the response for. We recommend using the country code or lat-lon values
 * @return {Promise<string | Object | ArrayBuffer | ReadableStream | null>}
 */
export function fetchDataFromKv(env: cloudflareEnv, key: string): Promise<string | any | ArrayBuffer | ReadableStream | null>;
//# sourceMappingURL=index.d.ts.map