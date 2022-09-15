import { Internal } from '../../internal/index.js'

/**
 * Function to cek if the input text has a space or not. If yes, then will replace space with "-"
 *
 * @function
 * @param {string} text -- stream's name
 * @returns {string} -- stream's slug as per stream's name but without space
 */
function replaceWhiteSpace(text) {
  return /\s/.test(text) ? text.split(' ').join('-') : text
}

/**
 * @typedef FetchResponse
 * @property {object} status -- A status response
 * @property {object} data -- A return data as per endpoint
 */

/**
 * A create stream module that should pass stream's name parameter, and user could pass the stream's slug & description parameter as well
 *
 * @param {string} name -- name of stream
 * @param {string} slug -- slug of stream
 * @param {string} description -- description of stream
 * @returns {Promise<FetchResponse>} returns the restructured data which content status & created stream data
 * @throws {Error}
 */
export const createStream = async (name, slug, description) => {
  // console.log('ini apa?', slug !== null && slug !== undefined)
  if (name === null || name === undefined) {
    throw new Error(
      'Failed to create a new stream because the name of the stream is empty. Please provide a stream name'
    )
  } else if (typeof name !== 'string') {
    throw new TypeError(
      'Failed to create a new stream because the name of the stream is not in string format. A stream name must be in string format'
    )
  } else if (slug !== null && slug !== undefined && typeof slug !== 'string') {
    // console.log('msk error slug')
    throw new Error(
      'Failed to create a new stream because the slug of the stream is not in string format. A slug must be in string format'
    )
  } else if (
    description !== null &&
    description !== undefined &&
    typeof description !== 'string'
  ) {
    // console.log('msk error description')
    throw new Error(
      'Failed to create a new stream because the description of the stream is not in string format. A description must be in string format'
    )
  } else {
    // console.log('msk else')

    let fetchResponse = await Internal.fetchHttp({
      url: `${Internal.config.api.base_url}/${Internal.config.api.version}/streams/create`,
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NjMyOTM5NDcsImlzcyI6ImlubGl2ZSIsIlRva2VuVHlwZSI6InRva2VuIiwiVXNlciI6eyJpZCI6NjMsInVzZXJuYW1lIjoiIiwicGFzc3dvcmQiOiIiLCJjb25maXJtX3Bhc3N3b3JkIjoiIiwibmFtZSI6IiIsImxvZ2luX3R5cGUiOjAsImVtYWlsIjoiIiwicm9sZV9pZCI6MCwicGljdHVyZV91cmwiOiIiLCJpc19hY3RpdmUiOmZhbHNlLCJyZWdpc3Rlcl9kYXRlIjoiMDAwMS0wMS0wMVQwMDowMDowMFoiLCJ1cGRhdGVkX2RhdGUiOm51bGx9fQ.Bb5Pyf-9JN0VeiITKBenbDul32XfFyJrKUi0PX8usJg',
      // token: '',
      method: 'POST',
      body: {
        name: name,
        slug: slug || replaceWhiteSpace(name),
        description: description || '',
      },
    }).catch((error) => {
      return error
    })

    if (fetchResponse !== null || fetchResponse !== undefined) {
      switch (fetchResponse.code) {
        case 200: {
          fetchResponse = {
            status: {
              code: fetchResponse.code,
              message: 'Successfully created a new stream',
              type: 'success',
            },
            data: fetchResponse?.data,
          }
          break
        }
        case 403: {
          throw new Error(
            'Failed to create a new stream because the API Key is not valid. Please provide a valid and active API Key.'
          )
        }
        case 500: {
          throw new Error(
            'Failed to create a new stream because unexpected error from the server'
          )
        }
        default:
          break
      }
    }

    return fetchResponse
  }
}
