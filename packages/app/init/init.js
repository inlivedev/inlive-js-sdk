import { api, webrtc } from '../../internal/config/index.js'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import merge from 'lodash.merge'
/**
 * @typedef Config
 * @property {string} apiKey - A string key for API authentication
 * @property {import('../../internal/config/api.js').API} api - config for API
 * @property {import('../../internal/config/webrtc.js').WebRTC} webrtc - config for WebRTC
 */

/**
 * A function to create object
 *
 * @param {Config} config -- being passed from init module parameter
 */
export function InitializationInstance(config) {
  this.config = config
}

/**
 * Initialize an initialization instance
 *
 * @function
 * @param {Config} config - A set of key/value parameter configuration
 * @returns {InitializationInstance} InitializationInstance that contains config object of apiKey
 * @throws {Error}
 */
const init = (config) => {
  const defaultConfig = {
    apiKey: '',
    api: api,
    webrtc: webrtc,
  }

  if (config !== undefined && config.apiKey !== undefined) {
    if (typeof config.apiKey !== 'string') {
      throw new TypeError(
        'Failed to process because the API key is not in a valid string format. API key must be in a string format'
      )
    } else if (config.apiKey.trim().length === 0) {
      throw new Error(
        'Failed to process because the API key field is an empty string. Please provide an API key.'
      )
    }
  }

  merge(defaultConfig, config)

  return new InitializationInstance(defaultConfig)
}

export { init }
