import { InitializationInstance } from '../../app/init/init.js'
import { Internal } from '../../internal/index.js'
import camelcaseKeys from 'camelcase-keys'

/**
 * @typedef FetchResponse
 * @property {object} status -- A status response
 * @property {Array<any>} data -- A return data as per endpoint
 */

/**
 * A get list of streams module based on the API Key (per project)
 *
 * @function
 * @param {InitializationInstance} initInstance -- initialization object
 * @returns {Promise<FetchResponse>} returns the restructured data which content status & list of streams data
 * @throws {Error}
 */
export const getStreams = async (initInstance) => {
  if (initInstance.constructor.name !== InitializationInstance.name) {
    throw new TypeError(
      'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function'
    )
  } else {
    const baseUrl = `${initInstance.config.api.baseUrl}/${initInstance.config.api.version}`

    let fetchResponse = await Internal.fetchHttp({
      url: `${baseUrl}/streams`,
      token: initInstance.config.apiKey,
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
              message: 'Successfully got a list of streams',
              type: 'success',
            },
            data: camelcaseKeys(fetchResponse.data),
          }

          break
        case 403: {
          throw new Error(
            'Failed to get a list of streams because the API Key is not valid. Please provide a valid and active API Key.'
          )
        }
        default:
          break
      }
    }

    return fetchResponse
  }
}
