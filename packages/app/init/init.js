/**
 * @typedef Config
 * @property {string | undefined} api_key - A string of key that will be used to access inLive protected API
 */

/**
 * A function to create object
 *
 * @param {Config} config -- being passed from init module parameter
 */
function initializeConfig(config) {
  this.config = config
}

/**
 * Initialize an initialization object
 *
 * @function
 * @param {Config} config - A set of key/value parameter configuration
 * @returns {object} InitializationObject that contains config object of api_key
 * @throws {Error}
 */
const init = (config) => {
  if (!config || config.api_key === undefined) {
    throw new Error(
      'Failed to process because the API key is not provided. Please provide an API key.'
    )
  } else if (typeof config.api_key !== 'string') {
    throw new TypeError(
      'Failed to process because the API key is not in a valid string format. API key must be in a string format'
    )
  } else if (config.api_key.trim().length === 0) {
    throw new Error(
      'Failed to process because the API key field is an empty string. Please provide an API key.'
    )
  } else {
    return new initializeConfig(config)
  }
}

export { init }
