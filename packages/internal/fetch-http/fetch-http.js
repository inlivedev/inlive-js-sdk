/**
 * @typedef BaseConfig
 * @property {string} url - The API endpoint URL
 * @property {string} [token] - The bearer token for authorization purpose
 * @property {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'} [method] - The HTTP request methods used
 * @property {object} [body] - The request body which contains the data that will be transmitted in an HTTP request
 * @property {object} [options] - Option fetch parameter
 */

/**
 * @type {BaseConfig}
 */
const baseConfig = {
  url: '',
  token: '',
  method: 'GET',
  body: undefined,
  options: undefined,
}

/**
 * A HTTP client module to fetch a request in the browser and server sides
 *
 * @function
 * @param {BaseConfig} config A set of key/value parameter configuration
 * @returns {Promise<any>} Returns a promise with the actual response data
 * @throws {Error}
 */
export const fetchHttp = async (config = baseConfig) => {
  const { url, token, method, body, options: fetchOptions } = config

  if (url.trim().length === 0) {
    throw new Error('Please provide the url')
  }

  const options = {
    method: method || 'GET',
    mode: 'cors',
    referrerPolicy: 'origin-when-cross-origin',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
    body:
      typeof body === 'object' && method !== 'GET'
        ? JSON.stringify(body)
        : undefined,
    ...fetchOptions,
  }

  let fetchHttpRequest

  if (typeof window === 'undefined' || !window) {
    /**
     * Server side fetch HTTP request
     *
     * @param {string} url - The API endpoint URL
     * @param {object} options - Option fetch parameter
     * @returns {Promise<any>} Returns a promise with the actual response data
     */
    fetchHttpRequest = (url, options) => {
      return import('node-fetch').then(({ default: fetch }) => {
        return fetch(url, options)
      })
    }
  } else {
    /**
     * Client side fetch HTTP request
     *
     * @param {string} url - The API endpoint URL
     * @param {object} options - Option fetch parameter
     * @returns {Promise<any>} Returns a promise with the actual response data
     */
    fetchHttpRequest = (url, options) => {
      return window.fetch(url, options)
    }
  }

  /** @type {Response} */
  const response = await fetchHttpRequest(url, options)
  const contentType = response.headers.get('content-type')

  let json = {}

  if (contentType && contentType.includes('application/json')) {
    json = await response.json()
  } else {
    const text = await response.text()
    json = text
  }

  return response.ok && response.status >= 200 && response.status < 300
    ? Promise.resolve(json)
    : Promise.reject(json)
}
