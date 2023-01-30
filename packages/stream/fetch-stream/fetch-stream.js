import { InitializationInstance } from '../../app/init/init.js'
import { Internal } from '../../internal/index.js'

/**
 * @typedef StreamResponse
 * @property {number} id - id of stream
 * @property {string} name - name of stream
 * @property {string} slug - slug or URL friendly name
 * @property {string} description - description for the stream
 * @property {string} hlsUrl - HLS manifest URL
 * @property {string} dashUrl - a Dash format URL
 * @property {string} createdAt - a time string when the stream is created
 * @property {string} startedAt - a time string when the stream is started
 * @property {string} endedAt - a time string when the stream is ended
 */

/**
 * A get specific stream data module based on the stream ID passing parameter
 *
 * @param {InitializationInstance} initObject -- initialization object
 * @param {number} streamId -- stream ID
 * @returns {Promise<StreamResponse>} returns the restructured data which content status & specific stream data
 * @throws {Error}
 */
export const fetchStream = async (initObject, streamId) => {
  if (initObject.constructor.name !== 'InitializationInstance') {
    throw new TypeError(
      'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function'
    )
  }

  if (streamId === null || streamId === undefined) {
    throw new Error(
      'Failed to get the stream data because the stream ID is empty. Please provide a stream ID'
    )
  } else if (typeof streamId !== 'number') {
    throw new TypeError(
      'Failed to get the stream data because the stream ID is not in number format. A stream ID must be number format'
    )
  } else {
    const baseUrl = `${initObject.config.api.baseUrl}/${initObject.config.api.version}`

    let fetchResponse = await Internal.fetchHttp({
      url: `${baseUrl}/streams/${streamId}`,
      token: initObject.config.apiKey,
      method: 'GET',
    }).catch((error) => {
      return error
    })

    if (fetchResponse && fetchResponse.code === 404) {
      throw new Error(
        'Failed to get the stream data because the stream ID is not found. Please provide a valid stream ID.'
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
      startedAt: stream.start_time,
      endedAt: stream.end_time,
    }

    return streamResponse
  }
}
