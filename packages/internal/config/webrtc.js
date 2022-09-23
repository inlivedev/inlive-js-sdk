/**
 * @typedef ICEServers
 * @property {string} urls - The server URL
 * @property {string} [username] - The username that will be used to connect with the server
 * @property {string} [credential] - The credential that will be used to connect with the server
 */

/**
 * @typedef WebRTC
 * @property {Array<ICEServers>} iceServers - ICE servers used to allow connection with the peers
 */

/**
 * @type {WebRTC} - The webrtc configuration
 */
const webrtc = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:34.101.37.212:3478',
      username: 'username',
      credential: 'password',
    },
  ],
}

Object.freeze(webrtc)

export { webrtc }
