import { InitializationInstance } from '../../app/init/init.js'
import { fetchHttp } from '../../internal/modules.js'

/**
 * Prepare a stream session
 *
 * @param {InitializationInstance} initInstance - The initialization instance received from the init() function
 * @param {number} streamID - the stream ID
 * @returns {Promise<boolean>} status -  Promise object that will resolve the stream
 */
const prepareStream = async (initInstance, streamID) => {
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
    const response = await fetchHttp({
      url: `${baseUrl}/streams/${streamID}/prepare`,
      token: initInstance.config.apiKey,
      method: 'POST',
      body: {},
    })

    if (response.code >= 300) {
      throw new Error('failed to request prepare endpoint:' + response.message)
    }

    return true
  } catch (error) {
    console.error('error sdk prepare', error)
    throw error
  }
}

export { prepareStream }
