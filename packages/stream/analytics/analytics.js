import { InitializationInstance } from '../../app/init/init.js'
import { Internal } from '../../internal/index.js'
import { api } from '../../internal/config/index.js'
import { merge } from 'lodash'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import snakecaseKeys from 'snakecase-keys'
import camelcaseKeys from 'camelcase-keys'

/**
 * @typedef FetchStatus
 * @property {number} code - status code
 * @property {string} message - status message
 * @property {string} type - status type
 */

/**
 * @typedef FetchResponse
 * @property {FetchStatus} status -- A status response
 * @property {Array<any>} data -- A return data as per endpoint
 */

/**
 * @typedef trackEvent
 * @property {string} clientID - unique identifier of the client, should be store in cookie or local storage to make it persistence
 * @property {number} elapsedTimeInSeconds - elapsed time in seconds
 * @property {number} clientTimeInUnixMillis - unix epoch time
 * @property {string} name - event name
 * @property {object} data - event object
 */

const fpPromise = FingerprintJS.load({ monitoring: false })

/**
 * Track analytic event
 *
 * @param {number} streamID - The ID of the stream
 * @param {trackEvent} data - track event data to report
 * @param {import('../../internal/config/api.js').API} [apiOptions] - options for tracking request
 * @returns {Promise<FetchResponse>} returns the response data
 * @throws {Error}
 */
export const track = async (streamID, data, apiOptions) => {
  const defaultConfig = api
  if (typeof apiOptions !== 'undefined') {
    merge(defaultConfig, apiOptions)
  }
  const baseUrl = `${defaultConfig.baseUrl}/${defaultConfig.version}`

  data.clientID = await getClientID()
  const statsAuthKey = await getStatsAuthKey(baseUrl, streamID, data.clientID)

  let fetchResponse = await Internal.fetchHttp({
    url: `${baseUrl}/streams/${streamID}/stats`,
    token: statsAuthKey,
    method: 'POST',
    body: snakecaseKeys(data),
  }).catch((error) => {
    throw error
  })

  if (fetchResponse) {
    switch (fetchResponse.code) {
      case 200:
        fetchResponse = {
          status: {
            code: fetchResponse.code,
            message: 'Successfully send the data',
            type: 'success',
          },
          data: camelcaseKeys(fetchResponse.data),
        }

        break
      case 403: {
        throw new Error(
          'Failed to send the data because the API Key is not valid. Please provide a valid and active API Key.'
        )
      }
      default:
        break
    }
  }

  return fetchResponse
}

/**
 * Get client ID with FingerPrintJS and stored in local storage
 */
const getClientID = async () => {
  const clientID = localStorage.getItem('inlive_client_id')
  if (clientID) return clientID

  const fp = await fpPromise
  const result = await fp.get()
  localStorage.setItem('inlive_client_id', result.visitorId)

  return result.visitorId
}

/**
 * Get auth key for stat request
 *
 * @param {string} baseUrl - base url
 * @param {number} streamID - stream ID
 * @param {string} clientID - client ID
 * @returns {Promise<string>} returns the auth key
 * @throws {Error}
 */
const getStatsAuthKey = async (baseUrl, streamID, clientID) => {
  const body = {
    clientId: clientID,
  }

  const fetchResponse = await Internal.fetchHttp({
    url: `${baseUrl}/streams/${streamID}/stats/auth`,
    method: 'POST',
    body: snakecaseKeys(body),
  }).catch((error) => {
    throw error
  })

  if (fetchResponse.code !== 200) {
    throw new Error(fetchResponse.message)
  }

  return fetchResponse.data
}

const statsLogsOptions = {
  page: 1,
  pageSize: 10,
}

/**
 *
 * @param {InitializationInstance} initInstance - The initialization instance received from the init() function
 * @param {number} streamID - stream ID
 * @param {{
 *  page: number,
 *  pageSize: number
 * }} options - The stats logs options
 * @returns {Promise<FetchResponse>} Returns a list of stats event
 */
export const getStatsLogs = async (
  initInstance,
  streamID,
  options = statsLogsOptions
) => {
  const defaultConfig = api

  if (initInstance.constructor.name !== InitializationInstance.name) {
    throw new TypeError(
      `Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function`
    )
  } else if (typeof streamID !== 'number') {
    throw new TypeError(
      'Failed to process because the stream ID is not in a number format. The stream ID must be in a number format'
    )
  }

  if (typeof initInstance.config.api === 'object') {
    merge(defaultConfig, initInstance.config.api)
  }

  const apiUrl = `${defaultConfig.baseUrl}/${defaultConfig.version}`

  let fetchResponse = await Internal.fetchHttp({
    url: `${apiUrl}/streams/${streamID}/logs?page=${options.page}&page_size=${options.pageSize}`,
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
            message: 'Successfully got a list of stats event',
            type: 'success',
          },
          data: camelcaseKeys(fetchResponse.data),
        }

        break
      case 403: {
        throw new Error(
          'Failed to get a list of stats event because the API Key is not valid. Please provide a valid and active API Key.'
        )
      }
      default:
        break
    }
  }

  return fetchResponse
}

/**
 * Subscribe to stats event
 *
 * @param {InitializationInstance} initInstance - The initialization instance received from the init() function
 * @param {number} streamID - stream ID
 * @returns {Promise<EventSource>} returns the event source
 * @example
 * const Stat = {
 *  PLAYER: 'player',
 *  WEBRTC: 'webrtc',
 *  CLIENTSTAT: 'client_stat',
 *  CLIENTLOG: 'client_log',
 * }
 *
 * const events = await getStatsRealtime(initInstance,streamID)
 * events.addEventListener(Stat.PLAYER,(ev)=>{console.log(ev.data)})
 */
export const getStatsRealtime = async (initInstance, streamID) => {
  const defaultConfig = api

  if (initInstance.constructor.name !== InitializationInstance.name) {
    throw new TypeError(
      `Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function`
    )
  } else if (typeof streamID !== 'number') {
    throw new TypeError(
      'Failed to process because the stream ID is not in a number format. The stream ID must be in a number format'
    )
  }

  if (typeof initInstance.config.api === 'object') {
    merge(defaultConfig, initInstance.config.api)
  }

  const apiUrl = `${defaultConfig.baseUrl}/${defaultConfig.version}`
  const eventKey = await Internal.getEventKey(
    initInstance.config.apiKey,
    apiUrl
  )

  const events = new EventSource(
    `${apiUrl}/streams/${streamID}/stats/${eventKey}`,
    {
      withCredentials: true,
    }
  )

  return events
}
