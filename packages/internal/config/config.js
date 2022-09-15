/**
 * @typedef API
 * @property {string} base_url - The base URL for inLive API.
 * @property {string} version - The version of the API
 */

/**
 * @type {API}
 */
const api = {
  base_url: 'https://api.inlive.app',
  version: 'v1',
}

/**
 * @typedef ICEServers
 * @property {string} urls - The server URL
 * @property {string} [username] - The username that will be used to connect with the server
 * @property {string} [credential] - The credential that will be used to connect with the server
 */

/**
 * @typedef WebRTC
 * @property {Array<ICEServers>} servers - Servers used to allow connection with the peers
 */

/**
 * @type {WebRTC}
 */
const webrtc = {
  servers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:34.101.121.241:3478',
      username: 'username',
      credential: 'password',
    },
  ],
}

/**
 * @typedef Channel
 * @property {string} base_url - The base URL for the inLive stream channel
 */

/**
 * @type {Channel}
 */
const channel = {
  base_url: 'https://channel.inlive.app',
}

export { api, webrtc, channel }
