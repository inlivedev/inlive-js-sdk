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
 * @param {string} baseUrl -- The base URL of API endpoint with its version
 * @param {number} streamId -- stream ID
 * @returns {Promise<StreamResponse>} returns the restructured data which content status & specific stream data
 * @throws {Error}
 */
export const fetchStream = async (baseUrl, streamId) => {
  if (typeof baseUrl !== 'string' || baseUrl.trim().length === 0) {
    throw new Error('Error because invalid API base url')
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
    let fetchResponse = await Internal.fetchHttp({
      url: `${baseUrl}/streams/${streamId}`,
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
