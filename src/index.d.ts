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
export function getLocation(request: cloudflareRequest, options?: locationOptions): locationResponse;
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
export function savePageToKv(env: cloudflareEnv, key: string, response: cloudflareResponse, options?: kvOptions): Promise<void>;
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