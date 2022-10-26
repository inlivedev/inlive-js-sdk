import { InitializationInstance } from '../../app/init/init.js'
import { Internal } from '../../internal/index.js'
import snakecaseKeys from 'snakecase-keys'

/**
 * @typedef Config
 * @property {number} streamId - The ID of the stream
 * @property {RTCSessionDescription | null} sessionDescription - The werbtc local session description
 */

/**
 * initialize a stream session
 *
 * @param {object} initInstance - The initialization instance received from the init() function
 * @param {Config} config - Key / value configuration
 */
const initStream = async (initInstance, config) => {
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
  } else if (
    !config.sessionDescription ||
    !config.sessionDescription.type ||
    !config.sessionDescription.sdp
  ) {
    throw new TypeError(
      'Failed to process because the local description has wrong format'
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

  const { streamId, sessionDescription } = config

  /**
   * ======================================================
   *  Executions
   * ======================================================
   */

  const baseUrl = `${baseConfig.api.base_url}/${baseConfig.api.version}`

  try {
    const body = snakecaseKeys({
      sessionDescription,
    })

    const response = await fetchHttp({
      url: `${baseUrl}/streams/${streamId}/init`,
      token: apiKey,
      method: 'POST',
      body,
    })

    const { code, data } = response

    const successResponse = {
      status: {
        code: code || null,
        type: 'success',
        message: 'Successfully initialize a stream session',
      },
      data: {
        sdp: data && data.sdp ? data.sdp : null,
        type: data && data.type ? data.type : null,
      },
    }

    return successResponse
  } catch (error) {
    console.error(error)
    throw error
  }
}

export { initStream }
