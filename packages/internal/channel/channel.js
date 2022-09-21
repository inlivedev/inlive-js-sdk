import { websocket as websocketConfig } from '../config/index.js'

/**
 * @typedef Connection
 * @property {WebSocket | undefined} client - The client interface that manages the connection between the client and server channels
 */

const channel = (() => {
  /**
   * ======================================================
   *  Variables
   * ======================================================
   */

  /**
   * @type {Connection}
   */
  const connection = {
    client: undefined,
  }

  const baseUrl = `${websocketConfig.base_url}/${websocketConfig.version}`

  /**
   * ======================================================
   *  Functions
   * ======================================================
   */

  /**
   * Subscribe to the channel
   *
   * @param {number} stream_id - The ID of the stream
   * @returns {WebSocket | void} Returns the client interface
   * @throws {Error | TypeError}
   */
  const subscribe = (stream_id) => {
    if (!stream_id) {
      throw new Error(
        'Failed to process - A stream ID is required to subscribe to the channel'
      )
    } else if (typeof stream_id !== 'number') {
      throw new TypeError(
        'Failed to process - Invalid stream ID format. Stream ID must use a number format'
      )
    }

    if (!(connection.client instanceof WebSocket)) {
      const subscribeUrl = `${baseUrl}/streams/${stream_id}/websocket`
      connection.client = new WebSocket(subscribeUrl)
      return connection.client
    }

    return
  }

  /**
   * Unsubscribe from the channel
   */
  const unsubscribe = () => {
    if (connection.client instanceof WebSocket) {
      connection.client.close()
      connection.client = undefined
    }
    return
  }

  /**
   * Listen to the open event
   *
   * @param {Function} callback - A callback function
   */
  const onOpen = (callback) => {
    if (
      connection.client instanceof WebSocket &&
      callback instanceof Function
    ) {
      connection.client.addEventListener('open', (event) => {
        callback(event)
      })
    }
  }

  /**
   * Listen to the error event
   *
   * @param {Function} callback - A callback function
   */
  const onError = (callback) => {
    if (
      connection.client instanceof WebSocket &&
      callback instanceof Function
    ) {
      connection.client.addEventListener('error', (event) => {
        callback(event)
      })
    }
  }

  /**
   * Listen to the message event
   *
   * @param {Function} callback - A callback function
   */
  const onMessage = (callback) => {
    if (
      connection.client instanceof WebSocket &&
      callback instanceof Function
    ) {
      connection.client.addEventListener(
        'message',
        /** @param {any} event - The Event Object with additional data property */
        (event) => {
          if (event.data) {
            const data = JSON.parse(event.data)
            callback(data)
          }
        }
      )
    }
  }

  return {
    onError,
    onMessage,
    onOpen,
    subscribe,
    unsubscribe,
  }
})()

Object.freeze(channel)

export { channel }
