/**
 * @typedef Connection
 * @property {EventTarget | undefined} client - The client interface that manages the connection between the client and server channels
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

  /**
   * ======================================================
   *  Functions
   * ======================================================
   */

  /**
   *
   * @param {EventTarget} clientInterface - The client interface that manages the connection between the client and server channels
   * @returns {EventTarget | void} Returns the client interface
   */
  const subscribe = (clientInterface) => {
    if (
      !(connection.client instanceof EventTarget) &&
      clientInterface instanceof EventTarget
    ) {
      connection.client = clientInterface
      return connection.client
    }

    return
  }

  /**
   *
   * @param {Function} callback - A callback function
   */
  const onOpen = (callback) => {
    if (
      connection.client instanceof EventTarget &&
      callback instanceof Function
    ) {
      connection.client.addEventListener('open', (event) => {
        callback(event)
      })
    }
  }

  /**
   *
   * @param {Function} callback - A callback function
   */
  const onError = (callback) => {
    if (
      connection.client instanceof EventTarget &&
      callback instanceof Function
    ) {
      connection.client.addEventListener('error', (event) => {
        callback(event)
      })
    }
  }

  /**
   *
   * @param {Function} callback - A callback function
   */
  const onMessage = (callback) => {
    if (
      connection.client instanceof EventTarget &&
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
    subscribe,
    onOpen,
    onError,
    onMessage,
  }
})()

Object.freeze(channel)

export { channel }
