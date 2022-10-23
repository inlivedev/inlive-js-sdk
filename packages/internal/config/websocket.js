/**
 * @typedef WebSocket
 * @property {string} baseUrl - The websocket base URL
 * @property {string} version - The version of the websocket API
 */

/**
 * @type {WebSocket} The websocket configuration
 */
const websocket = {
  baseUrl: 'wss://api.inlive.app',
  version: 'v1',
}

Object.freeze(websocket)

export { websocket }
