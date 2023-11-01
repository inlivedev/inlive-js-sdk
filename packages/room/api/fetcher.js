export const createFetcher = () => {
  const Fetcher = class {
    _baseUrl

    /** @param {string} baseUrl  */
    constructor(baseUrl) {
      this._baseUrl = baseUrl
    }

    /**
     * @param {Response} response
     * @throws {Error}
     */
    _resolution = async (response) => {
      if (!response) {
        throw new Error(`Cannot process response from the server`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return response
          .json()
          .then((json) => ({
            ...json,
            code: response.status,
            ok: response.ok,
          }))
          .catch((error) => {
            throw error
          })
      } else {
        throw new Error(`Cannot process response from the server`)
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
      const fetchOptions = typeof options === 'object' ? options : {}
      const headersOptions =
        typeof fetchOptions.headers === 'object' ? fetchOptions.headers : {}

      return globalThis
        .fetch(`${this._baseUrl}${endpoint}`, {
          headers: {
            'Content-type': 'application/json; charset=utf-8',
            ...headersOptions,
          },
          ...fetchOptions,
        })
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
    /** @param {string} baseUrl */
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
