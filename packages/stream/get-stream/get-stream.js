import { Internal } from '../../internal/index.js'
import { InitializationInstance } from '../../app/init/init.js'

/**
 * @typedef FetchResponse
 * @property {object} status -- A status response
 * @property {object} data -- A return data as per endpoint
 */

/**
 * A get specific stream data module based on the stream ID passing parameter
 *
 * @param {InitializationInstance} initObject -- initialization object
 * @param {number} stream_id -- stream ID
 * @returns {Promise<FetchResponse>} returns the restructured data which content status & specific stream data
 * @throws {Error}
 */
export const getStream = async (initObject, stream_id) => {
  if (!(initObject instanceof InitializationInstance)) {
    throw new TypeError(
      'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function'
    )
  } else if (stream_id === null || stream_id === undefined) {
    throw new Error(
      'Failed to get the stream data because the stream ID is empty. Please provide a stream ID'
    )
  } else if (typeof stream_id !== 'number') {
    throw new TypeError(
      'Failed to get the stream data because the stream ID is not in number format. A stream ID must be number format'
    )
  } else {
    let fetchResponse = await Internal.fetchHttp({
      url: `${Internal.config.api.base_url}/${Internal.config.api.version}/streams/${stream_id}`,
      token: initObject.config.api_key,
      method: 'GET',
    }).catch((error) => {
      return error
    })

    if (fetchResponse) {
      switch (fetchResponse.code) {
        case 200:
          fetchResponse = {
            status: {
              code: fetchResponse.code,
              message: 'Successfully got the stream data',
              type: 'success',
            },
            data: fetchResponse.data,
          }

          break
        case 404: {
          throw new Error(
            'Failed to get the stream data because the stream ID is not found. Please provide a valid stream ID.'
          )
        }
        default:
          break
      }
    }

    return fetchResponse
  }
}
