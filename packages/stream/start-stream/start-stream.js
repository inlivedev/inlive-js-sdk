import { InitializationInstance } from '../../app/init/init.js'
import { Internal } from '../../internal/index.js'

/**
 * Start a stream
 *
 * @param {InitializationInstance} initInstance - The initialization instance received from the init() function
 * @param {number} streamID - the stream ID
 * @returns {Promise<import('../stream.js').Manifests>} - return true if no error
 */
const startStream = async (initInstance, streamID) => {
  /**
   * ======================================================
   *  Validations
   * ======================================================
   */

  if (initInstance.constructor.name !== InitializationInstance.name) {
    throw new TypeError(
      `Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function`
    )
  } else if (!streamID) {
    throw new Error(
      'Failed to process because the stream ID is not provided. Please provide the stream ID!'
    )
  } else if (typeof streamID !== 'number') {
    throw new TypeError(
      'Failed to process because the stream ID is not in a number format. The stream ID must be in a number format'
    )
  }

  /**
   * ======================================================
   *  Executions
   * ======================================================
   */

  const baseUrl = `${initInstance.config.api.baseUrl}/${initInstance.config.api.version}`
  try {
    const response = await Internal.fetchHttp({
      url: `${baseUrl}/streams/${streamID}/start`,
      token: initInstance.config.apiKey,
      method: 'POST',
      body: {},
    })

    if (response.code >= 300) {
      throw new Error('failed to request start endpoint:' + response.message)
    }

    return response.data
  } catch (error) {
    console.error(error)
    throw error
  }
}

export { startStream }
