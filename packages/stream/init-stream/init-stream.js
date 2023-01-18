import { InitializationInstance } from '../../app/init/init.js'
import { Internal } from '../../internal/index.js'

/**
 * @typedef Parameters
 * @property {number} streamId - The ID of the stream
 * @property {RTCSessionDescription | null} sessionDescription - The werbtc local session description
 */

/**
 * initialize a stream session
 *
 * @param {InitializationInstance} initInstance - The initialization instance received from the init() function
 * @param {Parameters} parameters - Key / value configuration
 */
const initStream = async (initInstance, parameters) => {
  /**
   * ======================================================
   *  Validations
   * ======================================================
   */

  if (initInstance.constructor.name !== InitializationInstance.name) {
    throw new TypeError(
      `Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function`
    )
  } else if (!parameters || parameters.streamId === undefined) {
    throw new Error(
      'Failed to process because the stream ID is not provided. Please provide the stream ID!'
    )
  } else if (typeof parameters.streamId !== 'number') {
    throw new TypeError(
      'Failed to process because the stream ID is not in a number format. The stream ID must be in a number format'
    )
  } else if (
    !parameters.sessionDescription ||
    !parameters.sessionDescription.type ||
    !parameters.sessionDescription.sdp
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

  const { streamId, sessionDescription } = parameters

  /**
   * ======================================================
   *  Executions
   * ======================================================
   */

  const baseUrl = `${initInstance.config.api.baseUrl}/${initInstance.config.api.version}`

  try {
    const body = sessionDescription.toJSON()

    const response = await Internal.fetchHttp({
      url: `${baseUrl}/streams/${streamId}/init`,
      token: initInstance.config.apiKey,
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
