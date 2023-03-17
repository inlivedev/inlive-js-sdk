import { fetchHttp } from '../fetch-http/fetch-http.js'
/**
 * Get the event key for events endpoint authentication
 *
 * @param {string} token - API key to authenticate the request
 * @param {string} apiUrl - options for event key request
 * @returns {Promise<string>} eventKey - JWT token for event endpoint authentication
 */
export const getEventKey = async (token, apiUrl) => {
  let fetchResponse = await fetchHttp({
    url: `${apiUrl}/auth/eventkey`,
    token: token,
    method: 'POST',
  }).catch((error) => {
    return error
  })

  if (fetchResponse) {
    switch (fetchResponse.code) {
      case 200:
        token = fetchResponse.data

        break
      case 404: {
        throw new Error(
          'Failed to get the event key because the stream ID is not found. Please provide a valid stream ID.'
        )
      }
      case 403: {
        throw new Error(
          'Failed to get event key because the authentication is failed. Check the API key'
        )
      }
      default:
        break
    }
  }

  return token
}
