import { InitializationInstance } from '../../app/init/init.js'
import { Internal } from '../../internal/index.js'
import camelcaseKeys from 'camelcase-keys'

/**
 * @typedef FetchResponse
 * @property {object} status -- A status response
 * @property {Object<any, any>} data -- A return data as per endpoint
 */

/**
 * A get specific stream data module based on the stream ID passing parameter
 *
 * @param {InitializationInstance} initObject -- initialization object
 * @param {number} streamId -- stream ID
 * @returns {Promise<FetchResponse>} returns the restructured data which content status & specific stream data
 * @throws {Error}
 */
export const getStream = async (initObject, streamId) => {
  if (!(initObject instanceof InitializationInstance)) {
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
    const {
      config: { apiKey, apiOrigin, apiVersion },
    } = initObject

    const baseUrl = `${
      typeof apiOrigin != 'undefined' ? apiOrigin : Internal.config.api.baseUrl
    }/${
      typeof apiVersion != 'undefined'
        ? apiVersion
        : Internal.config.api.version
    }`

    let fetchResponse = await Internal.fetchHttp({
      url: `${baseUrl}/streams/${streamId}`,
      token: apiKey,
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
            data: camelcaseKeys(fetchResponse.data),
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
