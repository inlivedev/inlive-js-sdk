import { InitializationInstance } from '../../app/init/init.js'
import { Internal } from '../../internal/index.js'
import { getStream } from '../get-stream/get-stream.js'

/**
 * End and stop a stream
 *
 * @param {InitializationInstance} initInstance - The initialization instance received from the init() function
 * @param {number} streamId - the stream ID to end
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
    const response = await Internal.fetchHttp({
      url: `${baseUrl}/streams/${streamId}/end`,
      token: initInstance.config.apiKey,
      method: 'POST',
      body: {},
    })

    const latestStreamData = await getStream(initInstance, streamId)

    const successResponse = {
      status: {
        code: response.code || null,
        type: 'success',
        message: 'Successfully ended the stream',
      },
      data: latestStreamData.data || null,
    }

    return successResponse
  } catch (error) {
    console.error(error)
    throw error
  }
}

export { endStream }
