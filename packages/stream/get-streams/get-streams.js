import { Internal } from '../../internal/index.js'

/**
 * @typedef FetchResponse
 * @property {object} status -- A status response
 * @property {Array<any>} data -- A return data as per endpoint
 */

/**
 * A get list of streams module based on the API Key (per project)
 *
 * @function
 * @returns {Promise<FetchResponse>} returns the restructured data which content status & list of streams data
 * @throws {Error}
 */
export const getStreams = async () => {
  let fetchResponse = await Internal.fetchHttp({
    url: `${Internal.config.api.base_url}/${Internal.config.api.version}/streams/`,
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NjMyMDMzNDYsImlzcyI6ImlubGl2ZSIsIlRva2VuVHlwZSI6InRva2VuIiwiVXNlciI6eyJpZCI6OTMsInVzZXJuYW1lIjoiIiwicGFzc3dvcmQiOiIiLCJjb25maXJtX3Bhc3N3b3JkIjoiIiwibmFtZSI6IiIsImxvZ2luX3R5cGUiOjAsImVtYWlsIjoiIiwicm9sZV9pZCI6MCwicGljdHVyZV91cmwiOiIiLCJpc19hY3RpdmUiOmZhbHNlLCJyZWdpc3Rlcl9kYXRlIjoiMDAwMS0wMS0wMVQwMDowMDowMFoiLCJ1cGRhdGVkX2RhdGUiOm51bGx9fQ.B01hriveOMRaSu9VF4ENT45TNZAMm7av52LRipM8SB0',
    // token: '',
    // token:
    //   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NjI5NjQyNDcsImp0aSI6IjQwYzljZWUwLWE0NTQtNDY4Ny04NzM5LWNkZTA0NDk0NTg4NiIsImlhdCI6MTY2MjM1OTQ0NywiaXNzIjoiaW5saXZlIiwiZGJpZCI6NDAsIlRva2VuVHlwZSI6ImFwaWtleSIsIlVzZXIiOnsiaWQiOjkxLCJ1c2VybmFtZSI6IiIsInBhc3N3b3JkIjoiIiwiY29uZmlybV9wYXNzd29yZCI6IiIsIm5hbWUiOiIiLCJsb2dpbl90eXBlIjowLCJlbWFpbCI6IiIsInJvbGVfaWQiOjAsInBpY3R1cmVfdXJsIjoiIiwiaXNfYWN0aXZlIjpmYWxzZSwicmVnaXN0ZXJfZGF0ZSI6IjAwMDEtMDEtMDFUMDA6MDA6MDBaIiwidXBkYXRlZF9kYXRlIjpudWxsfX0.TNPrK6TB3laKhs-Pms4IKqUkAfXoPJMFHbnUKy_zHe0',
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
            message: 'Successfully got a list of streams',
            type: 'success',
          },
          data: fetchResponse.data,
        }

        break
      case 403: {
        throw new Error(
          'Failed to get a list of streams because the API Key is not valid. Please provide a valid and active API Key.'
        )
      }
      default:
        break
    }
  }

  return fetchResponse
}
