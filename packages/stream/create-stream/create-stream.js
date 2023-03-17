import { Internal } from '../../internal/index.js'
import { InitializationInstance } from '../../app/init/init.js'
import { Stream } from '../stream.js'

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
 * @typedef Parameters
 * @property {string} name -- name of stream
 * @property {string} [slug] -- slug of stream
 * @property {string} [description] -- description of stream
 */

/**
 * A create stream module for creating a new stream
 *
 * @function
 * @param {InitializationInstance} initObject -- initialization object
 * @param {Parameters} parameters - passing param from user including name, description, slug
 * @returns {Promise<Stream>} returns the restructured data which content status & created stream data
 * @throws {Error}
 */
export const createStream = async (initObject, parameters) => {
  if (initObject.constructor.name !== 'InitializationInstance') {
    throw new TypeError(
      'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function'
    )
  } else if (!parameters || typeof parameters !== 'object') {
    throw new TypeError(
      'Failed to process because params argument must be input in object format'
    )
  } else if (parameters.name === null || parameters.name === undefined) {
    throw new Error(
      'Failed to create a new stream because the name of the stream is empty. Please provide a stream name'
    )
  } else if (typeof parameters.name !== 'string') {
    throw new TypeError(
      'Failed to create a new stream because the name of the stream is not in string format. A stream name must be in string format'
    )
  } else if (
    parameters.slug !== null &&
    parameters.slug !== undefined &&
    typeof parameters.slug !== 'string'
  ) {
    throw new Error(
      'Failed to create a new stream because the slug of the stream is not in string format. A slug must be in string format'
    )
  } else if (
    parameters.description !== null &&
    parameters.description !== undefined &&
    typeof parameters.description !== 'string'
  ) {
    throw new Error(
      'Failed to create a new stream because the description of the stream is not in string format. A description must be in string format'
    )
  } else {
    const baseUrl = `${initObject.config.api.baseUrl}/${initObject.config.api.version}`

    let fetchResponse = await Internal.fetchHttp({
      url: `${baseUrl}/streams/create`,
      token: initObject.config.apiKey,
      method: 'POST',
      body: {
        name: parameters.name,
        slug: parameters.slug || slugify(parameters.name),
        description: parameters.description || '',
      },
    }).catch((error) => {
      throw error
    })

    if (fetchResponse && fetchResponse.code === 403) {
      throw new Error(
        'Failed to create a new stream because the API Key is not valid. Please provide a valid and active API Key.'
      )
    } else if (fetchResponse && fetchResponse.code >= 300) {
      throw new Error(
        'Failed to create a new stream because of unexpected error'
      )
    }

    const stream = fetchResponse.data
    const streamResponse = {
      id: stream.id,
      name: stream.name,
      slug: stream.slug,
      description: stream.description,
      hlsUrl: stream.hls_url,
      dashUrl: stream.dash_url,
      createdAt: stream.created_at,
      preparedAt: stream.prepared_at,
      startedAt: stream.start_time,
      endedAt: stream.end_time,
      quality: stream.quality,
    }
    return new Stream(initObject, streamResponse)
  }
}
