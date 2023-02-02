import { InitializationInstance } from '../../app/init/init.js'
import { Internal } from '../../internal/index.js'

/**
 * End and stop a stream
 *
 * @param {InitializationInstance} initInstance - The initialization instance received from the init() function
 * @param {number} streamId - the stream ID to end
 * @returns {Promise<boolean>} - return true if no error
 */
const endStream = async (initInstance, streamId) => {
  /**
   * ======================================================
   *  Validations
   * ======================================================
   */

  if (initInstance.constructor.name !== InitializationInstance.name) {
    throw new TypeError(
      `Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function`
    )
  } else if (!streamId || streamId === undefined) {
    throw new Error(
      'Failed to process because the stream ID is not provided. Please provide the stream ID!'
    )
  } else if (typeof streamId !== 'number') {
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
    await Internal.fetchHttp({
      url: `${baseUrl}/streams/${streamId}/end`,
      token: initInstance.config.apiKey,
      method: 'POST',
      body: {},
    })

    return true
  } catch (error) {
    console.error(error)
    throw error
  }
}

export { endStream }
