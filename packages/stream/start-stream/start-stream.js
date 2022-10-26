import { InitializationInstance } from '../../app/init/init.js'
import { Internal } from '../../internal/index.js'
import { getStream } from '../get-stream/get-stream.js'

/**
 * @typedef Config
 * @property {number} streamId - The ID of the stream
 */

/**
 * Start a stream
 *
 * @param {object} initInstance - The initialization instance received from the init() function
 * @param {Config} config - Key / value configuration
 */
const startStream = async (initInstance, config) => {
  /**
   * ======================================================
   *  Validations
   * ======================================================
   */

  if (!(initInstance instanceof InitializationInstance)) {
    throw new TypeError(
      `Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function`
    )
  } else if (!config || config.streamId === undefined) {
    throw new Error(
      'Failed to process because the stream ID is not provided. Please provide the stream ID!'
    )
  } else if (typeof config.streamId !== 'number') {
    throw new TypeError(
      'Failed to process because the stream ID is not in a number format. The stream ID must be in a number format'
    )
  }

  /**
   * ======================================================
   *  Variables
   * ======================================================
   */

  const {
    config: { apiKey },
  } = initInstance

  const { fetchHttp, config: baseConfig } = Internal

  const { streamId } = config

  /**
   * ======================================================
   *  Executions
   * ======================================================
   */

  const baseUrl = `${baseConfig.api.base_url}/${baseConfig.api.version}`
  try {
    const response = await fetchHttp({
      url: `${baseUrl}/streams/${streamId}/start`,
      token: apiKey,
      method: 'POST',
      body: {},
    })

    const latestStreamData = await getStream(streamId)

    const successResponse = {
      status: {
        code: response.code || null,
        type: 'success',
        message: 'Successfully started the stream',
      },
      data: latestStreamData.data || null,
    }

    return successResponse
  } catch (error) {
    console.error(error)
    throw error
  }
}

export { startStream }
