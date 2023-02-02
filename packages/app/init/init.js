import { api, webrtc } from '../../internal/config/index.js'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import merge from 'lodash.merge'
/**
 * @typedef Config
 * @property {string} apiKey - A string key for API authentication
 * @property {api} api - config for API
 * @property {webrtc} webrtc - config for WebRTC
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
  if (!config || config.apiKey === undefined) {
    throw new Error(
      'Failed to process because the API key is not provided. Please provide an API key.'
    )
  } else if (typeof config.apiKey !== 'string') {
    throw new TypeError(
      'Failed to process because the API key is not in a valid string format. API key must be in a string format'
    )
  } else if (config.apiKey.trim().length === 0) {
    throw new Error(
      'Failed to process because the API key field is an empty string. Please provide an API key.'
    )
  }

  const defaultConfig = {
    apiKey: config.apiKey,
    api: api,
    webrtc: webrtc,
  }

  merge(defaultConfig, config)

  return new InitializationInstance(defaultConfig)
}

export { init }
