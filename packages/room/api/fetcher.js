export const createFetcher = () => {
  const Fetcher = class {
    _baseUrl

    /**
     * @param {string} baseUrl
     */
    constructor(baseUrl) {
      this._baseUrl = baseUrl
    }

    /**
     * @param {Response} response
     * @throws {Error}
     */
    _resolution = async (response) => {
      if (!response) {
        throw new Error(`No response received from the server.`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        try {
          const jsonResp = await response.json()
          return {
            ...jsonResp,
            url: response.url,
            code: response.status,
            ok: response.ok,
            headers: response.headers,
          }
        } catch (error) {
          throw new Error(`Cannot process response from the server: ${error}`)
        }
      } else {
        const textResponse = await response.text()
        throw new Error(
          `Cannot process response from the server because of unsupported content-type. ${textResponse}.`
        )
      }
    }

    /** @param {Error} error */
    _rejection = (error) => {
      throw error
    }

    /**
     * @param {string} endpoint
     * @param {RequestInit} [options]
     */
    _fetcher = (endpoint, options = {}) => {
      options = typeof options === 'object' ? options : {}

      /** @type {RequestInit} */
      const init = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(typeof options.headers === 'object' ? options.headers : {}),
        },
      }

      return globalThis
        .fetch(`${this._baseUrl}${endpoint}`, init)
        .then(this._resolution)
        .catch(this._rejection)
    }

    getBaseUrl = () => {
      return this._baseUrl
    }

    /**
     * @param {string} endpoint
     * @param {RequestInit | undefined} [options]
     */
    get = (endpoint, options = {}) => {
      return this._fetcher(endpoint, {
        ...options,
        method: 'get',
      })
    }

    /**
     * @param {string} endpoint
     * @param {RequestInit | undefined} [options]
     */
    post = (endpoint, options = {}) => {
      return this._fetcher(endpoint, {
        ...options,
        method: 'post',
      })
    }

    /**
     * @param {string} endpoint
     * @param {RequestInit | undefined} [options]
     */
    put = (endpoint, options = {}) => {
      return this._fetcher(endpoint, {
        ...options,
        method: 'put',
      })
    }

    /**
     * @param {string} endpoint
     * @param {RequestInit | undefined} [options]
     */
    patch = (endpoint, options = {}) => {
      return this._fetcher(endpoint, {
        ...options,
        method: 'patch',
      })
    }

    /**
     * @param {string} endpoint
     * @param {RequestInit | undefined} [options]
     */
    delete = (endpoint, options = {}) => {
      return this._fetcher(endpoint, {
        ...options,
        method: 'delete',
      })
    }
  }

  return {
    /**
     * @param {string} baseUrl
     */
    createInstance: (baseUrl) => {
      const fetcher = new Fetcher(baseUrl)

      return {
        getBaseUrl: fetcher.getBaseUrl,
        get: fetcher.get,
        post: fetcher.post,
        put: fetcher.put,
        patch: fetcher.patch,
        delete: fetcher.delete,
      }
    },
  }
}
