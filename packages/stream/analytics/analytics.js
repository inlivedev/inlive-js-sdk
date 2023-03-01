import { Internal } from '../../internal/index.js'
import { InitializationInstance } from '../../app/init/init.js'

/**
 * @typedef eventData
 * @property {string} name - event name
 * @property {object} data - event data
 * /
 
 
/**
 * @typedef trackEvent
 * @property {string} client_id - unique identifier of the client, should be store in cookie or local storage to make it persistence
 * @property {number} elapsed_time - elapsed time in second
 * @property {number} client_time - unix epoch time
 * @property {number} stream_id - stream id
 * @property {eventData} event - event object
 * @example 
 * {
 *   "client_id" : uuid,
 *   "elapsed_time" : elapsed time in second,
 *   "client_time" : unix epoch time,
 *   "stream_id" : int,
 *   "event" : {
 *      "name" : string,
 *      "data" : {
 *         "key" : "value",
 *          ...
 *      },
 *   }
 *  }
 */

/**
 * Track analytic event
 *
 * @param {InitializationInstance} initObject - The initialization instance received from the init() function
 * @param {trackEvent} data - track event data to report
 * @returns {Promise<import('../../internal/fetch-http/fetch-http.js').APIResponse>} returns the status of the request
 * @throws {Error}
 */
export const track = async (initObject, data) => {
  const baseUrl = `${initObject.config.api.baseUrl}/${initObject.config.api.version}`

  const fetchResponse = await Internal.fetchHttp({
    url: `${baseUrl}/streams/${data.stream_id}/stats`,
    token: initObject.config.apiKey,
    method: 'POST',
    body: data,
  }).catch((error) => {
    throw error
  })

  return fetchResponse
}
