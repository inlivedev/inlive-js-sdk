import { Internal } from '../../internal/index.js'

/**
 * @typedef FetchResponse
 * @property {object} status -- A status response
 * @property {object} data -- A return data as per endpoint
 */

/**
 * A get specific stream data module based on the stream ID passing parameter
 *
 * @param {number} streamId -- stream ID
 * @returns {Promise<FetchResponse>} returns the restructured data which content status & specific stream data
 * @throws {Error}
 */
export const getStream = async (streamId) => {
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
      url: `${Internal.config.api.base_url}/${Internal.config.api.version}/streams/${streamId}`,
      method: 'GET',
    }).catch((error) => {
      if (error.code === 404) {
        throw new Error(
          'Failed to get the stream data because the stream ID is not found. Please provide a valid stream ID.'
        )
      }
    })

    if (fetchResponse && fetchResponse.code === 200) {
      fetchResponse = {
        status: {
          code: fetchResponse.code,
          message: 'Successfully got the stream data',
          type: 'success',
        },
        data: fetchResponse.data,
      }
    }

    return fetchResponse
  }
}
