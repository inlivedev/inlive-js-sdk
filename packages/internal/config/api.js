/**
 * @typedef API
 * @property {string} base_url - The inLive API base URL
 * @property {string} version - The version of the API
 */

/**
 * @type {API} - The API configuration
 */
const api = {
  base_url: 'https://api.inlive.app',
  version: 'v1',
}

Object.freeze(api)

export { api }
