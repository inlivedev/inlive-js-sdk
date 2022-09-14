/**
 * @typedef Config
 * @property {string | undefined} api_key - A string of key that will be used to access inLive protected API
 */

/**
 * @typedef InitializationObject
 * @property {object} config - The key/value configuration inside the initialization object
 * @property {string} config.api_key - A string of key that will be used to access inLive protected API
 * @property {string} name - The name of initialization object instance
 */

/**
 * Initialize an initialization object
 *
 * @function
 * @param {Config} config - A set of key/value parameter configuration
 * @returns {InitializationObject} InitializationObject
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
    return {
      config: {
        api_key: config.api_key,
      },
      name: 'default',
    }
  }
}

export { init }
