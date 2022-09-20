import { InitializationInstance } from '../../app/init/init.js'
import { Internal } from '../../internal/index.js'
import { getStream } from '../get-stream/get-stream.js'

/**
 * @typedef Config
 * @property {number} stream_id - The ID of the stream
 */

/**
 * Start a stream
 *
 * @param {object} initInstance - The initialization instance received from the init() function
 * @param {Config} config - Key / value configuration
 */
const startStream = async (initInstance, config) => {
  /**
   * ===============================================================
   *  Validations
   * ===============================================================
   */

  if (!(initInstance instanceof InitializationInstance)) {
    throw new TypeError(
      `Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function`
    )
  } else if (!config || config.stream_id === undefined) {
    throw new Error(
      'Failed to process because the stream ID is not provided. Please provide the stream ID!'
    )
  } else if (typeof config.stream_id !== 'number') {
    throw new TypeError(
      'Failed to process because the stream ID is not in a number format. The stream ID must be in a number format'
    )
  }

  /**
   * ===============================================================
   *  Variables
   * ===============================================================
   */

  const {
    config: { api_key },
  } = initInstance

  const { fetchHttp, config: baseConfig, webrtc } = Internal

  const { stream_id } = config

  const clientState = webrtc.getClientState()

  /**
   * ===============================================================
   *  Executions
   * ===============================================================
   */

  if (clientState === 'ready') {
    const baseUrl = `${baseConfig.api.base_url}/${baseConfig.api.version}`
    try {
      const response = await fetchHttp({
        url: `${baseUrl}/streams/${stream_id}/start`,
        token: api_key,
        method: 'POST',
        body: {},
      })

      const latestStreamData = await getStream(stream_id)

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
  } else {
    throw new Error(
      'Failed to process because the stream is not ready to do a live streaming'
    )
  }
}

export { startStream }
