/**
 * @typedef Config
 * @property {string} apiKey - A string of key that will be used to access inLive protected API
 * @property {string} apiOrigin - A string of the API origin, by default it will pointed to https://api.inlive.app
 * @property {string} apiVersion - A string of API version, by default it will be use v1
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
 * @returns {object} InitializationInstance that contains config object of apiKey
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
  } else {
    return new InitializationInstance(config)
  }
}

export { init }
