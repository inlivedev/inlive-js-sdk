import { InitializationInstance } from '../../app/init/init.js'
import { Internal } from '../../internal/index.js'
import merge from 'lodash-es/merge'

/**
 * @typedef StreamData
 * @property {number} id - id of stream
 * @property {string} name - name of stream
 * @property {string} slug - slug or URL friendly name
 * @property {string} description - description for the stream
 * @property {string} hlsUrl - HLS manifest URL
 * @property {string} dashUrl - a Dash format URL
 * @property {string} createdAt - a time string when the stream is created
 * @property {string} updatedAt - a time string when the stream is updated
 * @property {string} preparedAt - a time string when the stream is prepared
 * @property {string} startedAt - a time string when the stream is started
 * @property {string} endedAt - a time string when the stream is ended
 * @property {string} createdBy - the ID of the user who creates the stream
 * @property {string | null} updatedBy - the ID of the user who updates the stream
 * @property {string} quality - the quality of the stream
 */

/**
 * @typedef MetaData
 * @property {number} page - current page
 * @property {number} limit - page size limit in one page
 * @property {number} totalRecords - total number of stream records
 * @property {number} totalPages - total number of pages
 */

/**
 * @typedef StreamListResponse
 * @property {number} code -- A status code
 * @property {string} message -- A status message
 * @property {Array<StreamData>} data -- list of streams data in array
 * @property {MetaData} meta - A meta data
 */

/**
 * @typedef PaginationParameters
 * @property {number} [page] - the page number will be displayed (default: 1)
 * @property {number} [pageSize] - the total number of streams displayed on one page (default: 10)
 */

const defaultParameters = {
  page: 1,
  pageSize: 10,
}

/**
 * A get list of streams module based on the API Key (per project)
 *
 * @function
 * @param {InitializationInstance} initInstance -- initialization object
 * @param {PaginationParameters} [parameters] - config parameters in key/value pair
 * @returns {Promise<StreamListResponse>} returns the restructured data which content status & list of streams data
 * @throws {Error}
 */
export const getStreams = async (initInstance, parameters) => {
  merge(defaultParameters, parameters)

  if (initInstance.constructor.name !== InitializationInstance.name) {
    throw new TypeError(
      'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function'
    )
  }

  if (
    typeof defaultParameters.page !== 'undefined' &&
    typeof defaultParameters.page !== 'number'
  ) {
    throw new TypeError('Invalid `page` parameter')
  }

  if (
    typeof defaultParameters.pageSize !== 'undefined' &&
    typeof defaultParameters.pageSize !== 'number'
  ) {
    throw new TypeError('Invalid `pageSize` parameter')
  }

  const baseUrl = `${initInstance.config.api.baseUrl}/${initInstance.config.api.version}`

  let fetchResponse = await Internal.fetchHttp({
    url: `${baseUrl}/streams?page=${defaultParameters.page}&page_size=${defaultParameters.pageSize}`,
    token: initInstance.config.apiKey,
    method: 'GET',
  }).catch((error) => {
    return error
  })

  if (fetchResponse.code === 403) {
    throw new Error(
      'Failed to get a list of streams because the API Key is not valid. Please provide a valid and active API Key.'
    )
  }

  const result = {
    code: fetchResponse.code || 500,
    message: fetchResponse.message || 'Error',
    data: Array.isArray(fetchResponse.data)
      ? fetchResponse.data.map(
          /* eslint-disable @typescript-eslint/ban-ts-comment */
          /*@ts-ignore */
          (stream) => ({
            id: stream.id,
            name: stream.name,
            slug: stream.slug,
            description: stream.description,
            hlsUrl: stream.hls_url,
            dashUrl: stream.dash_url,
            createdAt: stream.created_at,
            updatedAt: stream.updated_at,
            preparedAt: stream.prepared_at,
            startedAt: stream.start_time,
            endedAt: stream.end_time,
            createdBy: stream.created_by,
            updatedBy: stream.updated_by,
            quality: stream.quality,
          })
        )
      : [],
    meta: {
      page: fetchResponse.meta.page,
      limit: fetchResponse.meta.limit,
      totalRecords: fetchResponse.meta.total_records,
      totalPages: fetchResponse.meta.total_pages,
    },
  }

  return result
}
