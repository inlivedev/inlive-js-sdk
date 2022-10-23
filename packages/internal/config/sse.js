/**
 * @typedef SseChannel
 * @property {string} baseUrl - The inLive stream SSE channel base URL
 */

/**
 * @type {SseChannel} - The sse channel configuration
 */
const sse = {
  baseUrl: 'https://channel.inlive.app',
}

Object.freeze(sse)

export { sse }
