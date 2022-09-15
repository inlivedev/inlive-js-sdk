import { Internal } from '../../internal/index.js'

/**
 * @typedef FetchResponse
 * @property {object} status -- A status response
 * @property {object} data -- A return data as per endpoint
 */

/**
 * A get specific stream data module based on the stream ID passing parameter
 *
 * @param {number} stream_id -- stream ID
 * @returns {Promise<FetchResponse>} returns the restructured data which content status & specific stream data
 * @throws {Error}
 */
export const getStream = async (stream_id) => {
  if (stream_id === null || stream_id === undefined) {
    throw new Error(
      'Failed to get the stream data because the stream ID is empty. Please provide a stream ID'
    )
  } else if (typeof stream_id !== 'number') {
    throw new TypeError(
      'Failed to get the stream data because the stream ID is not type of number. Please provide a valid stream ID'
    )
  } else {
    let fetchResponse = await Internal.fetchHttp({
      url: `${Internal.config.api.base_url}/${Internal.config.api.version}/streams/${stream_id}`,
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NjI2OTA5OTgsImlzcyI6ImlubGl2ZSIsIlRva2VuVHlwZSI6InRva2VuIiwiVXNlciI6eyJpZCI6MzEsInVzZXJuYW1lIjoiIiwicGFzc3dvcmQiOiIiLCJjb25maXJtX3Bhc3N3b3JkIjoiIiwibmFtZSI6IiIsImxvZ2luX3R5cGUiOjAsImVtYWlsIjoiIiwicm9sZV9pZCI6MCwicGljdHVyZV91cmwiOiIiLCJpc19hY3RpdmUiOmZhbHNlLCJyZWdpc3Rlcl9kYXRlIjoiMDAwMS0wMS0wMVQwMDowMDowMFoiLCJ1cGRhdGVkX2RhdGUiOm51bGx9fQ.5VyfcYVoq6BLujfRsoVpWphc01tl6uqQKHAWutdbTeU',
      // token: '',
      method: 'GET',
    }).catch((error) => {
      return error
    })

    if (fetchResponse !== null || fetchResponse !== undefined) {
      switch (fetchResponse.code) {
        case 200:
          fetchResponse = {
            status: {
              code: fetchResponse.code,
              message: 'Successfully got the stream data',
              type: 'success',
            },
            data: fetchResponse.data,
          }

          break
        case 404: {
          throw new Error(
            'Failed to get the stream data because the stream ID is not found. Please provide a valid stream ID.'
          )
        }
        default:
          break
      }
    }

    return fetchResponse
  }
}
