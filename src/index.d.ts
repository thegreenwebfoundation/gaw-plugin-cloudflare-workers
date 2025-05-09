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
 * @param {string} [config.locationType='country'] - Type of location data to use.
 * @param {Object} [config.htmlChanges=null] - Custom HTML rewriter for page modifications.
 * @param {string} [config.gawDataSource='electricity maps'] - Data source for grid information.
 * @param {string} [config.gawDataType='power'] - Type of grid data to fetch ('power' or 'carbon').
 * @param {string} [config.gawDataApiKey=''] - API key for the data source.
 * @param {boolean} [config.kvCacheData=false] - Whether to cache grid data in KV store.
 * @param {boolean} [config.kvCachePage=false] - Whether to cache modified pages in KV store.
 * @returns {Promise<Response>} A modified or unmodified response based on grid data and configuration.
 * @example
 * // Basic usage in a Cloudflare Worker
 * export default {
 *   async fetch(request, env, ctx) {
 *     return auto(request, env, ctx, {
 *       gawOptions: {
 *         apiKey: 'your-api-key'
 *       }
 *     });
 *   }
 * };
 */
declare function auto(request: cloudflareRequest, env: cloudflareEnv, ctx: cloudflareContext, config?: {
    contentType?: string[];
    ignoreRoutes?: string[];
    ignoreGawCookie?: string;
    locationType?: string;
    htmlChanges?: any;
    gawDataSource?: string;
    gawDataType?: string;
    gawDataApiKey?: string;
    kvCacheData?: boolean;
    kvCachePage?: boolean;
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