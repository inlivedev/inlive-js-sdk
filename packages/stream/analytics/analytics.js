import { Internal } from '../../internal/index.js'
import { api } from '../../internal/config/index.js'
import { merge } from 'lodash'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import snakecaseKeys from 'snakecase-keys'

/**
 * @typedef trackEvent
 * @property {string} clientID - unique identifier of the client, should be store in cookie or local storage to make it persistence
 * @property {number} elapsedTimeInSeconds - elapsed time in seconds
 * @property {number} clientTimeInUnixMillis - unix epoch time
 * @property {number} streamID - stream id
 * @property {string} name - event name
 * @property {object} data - event object
 */

const fpPromise = FingerprintJS.load({ monitoring: false })

/**
 * Track analytic event
 *
 * @param {trackEvent} data - track event data to report
 * @param {import('../../internal/config/api.js').API} [apiOptions] - options for tracking request
 * @returns {Promise<import('../../internal/fetch-http/fetch-http.js').APIResponse>} returns the status of the request
 * @throws {Error}
 */
export const track = async (data, apiOptions) => {
  const defaultConfig = api
  if (typeof apiOptions !== 'undefined') {
    merge(defaultConfig, apiOptions)
  }
  const baseUrl = `${defaultConfig.baseUrl}/${defaultConfig.version}`

  data.clientID = await getClientID()
  const statsAuthKey = await getStatsAuthKey(
    baseUrl,
    data.streamID,
    data.clientID
  )

  const fetchResponse = await Internal.fetchHttp({
    url: `${baseUrl}/streams/${data.streamID}/stats`,
    token: statsAuthKey,
    method: 'POST',
    body: snakecaseKeys(data),
  }).catch((error) => {
    throw error
  })

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

/**
 * Subscribe to stats event
 *
 * @param {import('../../app/init/init.js').Config} app - app instance
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
 * const events = await getStats(app,streamID)
 * events.addEventListener(Stat.PLAYER,(ev)=>{console.log(ev.data)})
 */
export const getStats = async (app, streamID) => {
  const apiUrl = app.api.baseUrl + '/' + app.api.version
  const eventKey = await Internal.getEventKey(app.apiKey, apiUrl)

  const events = new EventSource(
    `${apiUrl}/streams/${streamID}/stats/${eventKey}`,
    {
      withCredentials: true,
    }
  )

  return events
}
