import mergeWith from 'lodash-es/mergeWith.js'
import { createFetcher } from './fetcher.js'

const config = {
  baseUrl: 'https://api.inlive.app',
  apiVersion: 'v1',
  apiKey: '',
  expirySeconds: 3600,
}

/**
 * @typedef AccessTokenData
 * @property {string} access_token
 * @property {string} refresh_token
 */

/**
 * @typedef AccessTokenResponse
 * @property {string} url
 * @property {number} code
 * @property {boolean} ok
 * @property {string} message
 * @property {Headers} headers
 * @property {AccessTokenData} data
 */

/**
 * @param {import('../../internal/types/types.js').SharedType.DeepPartial<typeof config>} [userConfig]
 */
export const createAuth = async (userConfig = config) => {
  mergeWith(config, userConfig, (_, userValue) => {
    return Array.isArray(userValue) ? userValue : undefined
  })

  const url = `${config.baseUrl}/${config.apiVersion}`
  const fetcher = createFetcher().createInstance(url)

  if (typeof config.apiKey !== 'string' || config.apiKey.trim().length === 0) {
    throw new Error('API key is required.')
  }

  const body = { expiry_seconds: config.expirySeconds }

  /** @type {AccessTokenResponse} */
  const response = await fetcher.post('/keys/accesstoken', {
    headers: { Authorization: 'Bearer ' + config.apiKey },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const data = response.data || {}

  return {
    url: response.url,
    headers: response.headers,
    code: response.code || 500,
    ok: response.ok || false,
    message: response.message || '',
    data: {
      expirySeconds: config.expirySeconds,
      accessToken: data.access_token || '',
      refreshToken: data.refresh_token || '',
    },
  }
}
