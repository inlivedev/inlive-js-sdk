import mergeWith from 'lodash-es/mergeWith.js'
import { createFetcher } from './fetcher.js'

const config = {
  apiOrigin: 'https://api.inlive.app',
  apiVersion: 'v1',
  apiKey: '',
  expirySeconds: 3600,
}

/**
 * @param {import('../../internal/types/types.js').SharedType.DeepPartial<typeof config>} [userConfig]
 */
export const createAccessToken = async (userConfig = config) => {
  mergeWith(config, userConfig, (_, userValue) => {
    return Array.isArray(userValue) ? userValue : undefined
  })

  const baseUrl = `${config.apiOrigin}/${config.apiVersion}`
  const fetcher = createFetcher().createInstance(baseUrl)

  if (typeof config.apiKey !== 'string' || config.apiKey.trim().length === 0) {
    throw new Error('API key is required.')
  }

  const response = await fetcher.post('/keys/accesstoken', {
    headers: { Authorization: 'Bearer ' + config.apiKey },
  })

  const data = response.data || {}

  return {
    code: response.code || 500,
    ok: response.ok || false,
    message: response.message || '',
    data: {
      baseUrl: baseUrl,
      expirySeconds: config.expirySeconds,
      accessToken: data.access_token || '',
      refreshToken: data.refresh_token || '',
    },
  }
}
