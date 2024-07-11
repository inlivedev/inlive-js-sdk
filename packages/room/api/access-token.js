import mergeWith from 'lodash-es/mergeWith.js'
import { createFetcher } from './fetcher.js'

const config = {
  baseUrl: 'https://api.inlive.app',
  version: 'v1',
  apiKey: '',
  expirySeconds: 3600,
}

/**
 * @param {import('../../internal/types/types.js').SharedType.DeepPartial<typeof config>} [userConfig]
 */
export const createAccessToken = (userConfig = config) => {
  mergeWith(config, userConfig, (_, userValue) => {
    return Array.isArray(userValue) ? userValue : undefined
  })

  const baseUrl = `${config.baseUrl}/${config.version}`
  let accessToken = ''

  const fetcher = createFetcher().createInstance(baseUrl)

  const generateToken = async () => {
    if (
      typeof config.apiKey !== 'string' ||
      config.apiKey.trim().length === 0
    ) {
      throw new Error('API key is required.')
    }

    const response = await fetcher.post('/keys/accesstoken', {
      headers: { Authorization: 'Bearer ' + config.apiKey },
    })

    accessToken = response.data || ''

    return {
      code: response.code || 500,
      ok: response.ok || false,
      message: response.message || '',
      data: accessToken,
    }
  }

  const currentToken = () => {
    return accessToken
  }

  const removeToken = () => {
    accessToken = ''
  }

  return {
    generateToken,
    currentToken,
    removeToken,
  }
}
