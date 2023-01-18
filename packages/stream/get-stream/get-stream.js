import { InitializationInstance } from '../../app/init/init.js'
import { Stream } from '../stream.js'
import { fetchStream } from '../fetch-stream/fetch-stream.js'

/**
 * A get specific stream data module based on the stream ID passing parameter
 *
 * @param {InitializationInstance} initObject -- initialization object
 * @param {number} streamId -- stream ID
 * @returns {Promise<Stream>} returns the restructured data which content status & specific stream data
 * @throws {Error}
 */
export const getStream = async (initObject, streamId) => {
  if (initObject.constructor.name !== InitializationInstance.name) {
    throw new TypeError(
      'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the InliveApp.init() function'
    )
  }

  if (streamId === null || streamId === undefined) {
    throw new Error(
      'Failed to get the stream data because the stream ID is empty. Please provide a stream ID'
    )
  } else if (typeof streamId !== 'number') {
    throw new TypeError(
      'Failed to get the stream data because the stream ID is not in number format. A stream ID must be number format'
    )
  } else {
    const streamResponse = await fetchStream(initObject, streamId)

    return new Stream(initObject, streamResponse)
  }
}
