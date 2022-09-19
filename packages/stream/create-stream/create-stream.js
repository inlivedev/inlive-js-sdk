import { Internal } from '../../internal/index.js'
import { InitializationInstance } from '../../app/init/init.js'

/**
 * Function to cek if the input text has a space or not. If yes, then will replace space with "-"
 *
 * @function
 * @param {string} text -- stream's name
 * @returns {string} -- stream's slug as per stream's name but without space
 */
function slugify(text) {
  return text
    .toString() // Cast to string (optional)
    .normalize('NFKD') // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
    .toLowerCase() // Convert the string to lowercase letters
    .trim() // Remove whitespace from both sides of a string (optional)
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\\-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/-$/g, '') // Remove trailing -
}

/**
 * @typedef Config
 * @property {string} name -- name of stream
 * @property {string} slug -- slug of stream
 * @property {string} description -- description of stream
 */

/**
 * @typedef FetchResponse
 * @property {object} status -- A status response
 * @property {object} data -- A return data as per endpoint
 */

/**
 * A create stream module for creating a new stream
 *
 * @function
 * @param {InitializationInstance} initObject -- initialization object
 * @param {Config} config - passing param from user including name, description, slug
 * @returns {Promise<FetchResponse>} returns the restructured data which content status & created stream data
 * @throws {Error}
 */
export const createStream = async (initObject, config) => {
  if (!(initObject instanceof InitializationInstance)) {
    throw new TypeError(
      'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function'
    )
  } else if (!config || typeof config !== 'object') {
    throw new TypeError(
      'Failed to process because config argument must be input in object format'
    )
  } else if (config.name === null || config.name === undefined) {
    throw new Error(
      'Failed to create a new stream because the name of the stream is empty. Please provide a stream name'
    )
  } else if (typeof config.name !== 'string') {
    throw new TypeError(
      'Failed to create a new stream because the name of the stream is not in string format. A stream name must be in string format'
    )
  } else if (
    config.slug !== null &&
    config.slug !== undefined &&
    typeof config.slug !== 'string'
  ) {
    throw new Error(
      'Failed to create a new stream because the slug of the stream is not in string format. A slug must be in string format'
    )
  } else if (
    config.description !== null &&
    config.description !== undefined &&
    typeof config.description !== 'string'
  ) {
    throw new Error(
      'Failed to create a new stream because the description of the stream is not in string format. A description must be in string format'
    )
  } else {
    let fetchResponse = await Internal.fetchHttp({
      url: `${Internal.config.api.base_url}/${Internal.config.api.version}/streams/create`,
      token: initObject.config.api_key,
      method: 'POST',
      body: {
        name: config.name,
        slug: config.slug || slugify(config.name),
        description: config.description || '',
      },
    }).catch((error) => {
      return error
    })

    if (fetchResponse) {
      switch (fetchResponse.code) {
        case 200: {
          fetchResponse = {
            status: {
              code: fetchResponse.code,
              message: 'Successfully created a new stream',
              type: 'success',
            },
            data: fetchResponse?.data,
          }
          break
        }
        case 403: {
          throw new Error(
            'Failed to create a new stream because the API Key is not valid. Please provide a valid and active API Key.'
          )
        }
        case 500: {
          throw new Error(
            'Failed to create a new stream because unexpected error from the server'
          )
        }
        default:
          break
      }
    }

    return fetchResponse
  }
}
