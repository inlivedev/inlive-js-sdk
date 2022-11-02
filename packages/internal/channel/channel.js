import { fetchHttp } from '../fetch-http/fetch-http.js'
import snakecaseKeys from 'snakecase-keys'
import camelcaseKeys from 'camelcase-keys'

/**
 * @typedef {(url: string) => { client: EventSource | void }} SubscribeToSseType
 */

/**
 * @param {{client: EventSource | undefined}} connection - Object with EventSource client
 * @returns {{ subscribe: SubscribeToSseType }} Returns an object with subscribe method
 */
const subscribeToSse = (connection) => ({
  /** @type {SubscribeToSseType} */
  subscribe: (url) => {
    if (typeof url !== 'string') {
      throw new TypeError('Failed to process - URL must be a string')
    } else if (url.trim().length === 0) {
      throw new Error('Failed to process - URL cannot be empty')
    } else if (connection.client !== undefined) {
      throw new Error(
        'Failed to process - Client was already subscribed to the specific channel. You can unsubscribe and resubscribe again to different channel'
      )
    }

    connection.client = new EventSource(url)
    return connection
  },
})

/**
 * @typedef {(url: string) => { client: WebSocket | void }} SubscribeToWebSocketType
 */

/**
 * @param {{ client: WebSocket | undefined }} connection - Object with WebSocket client
 * @returns {{ subscribe: SubscribeToWebSocketType }} - Returns an object with subscribe method
 */
const subscribeToWebSocket = (connection) => ({
  /** @type {SubscribeToWebSocketType} */
  subscribe: (url) => {
    if (typeof url !== 'string') {
      throw new TypeError('Failed to process - URL must be a string')
    } else if (url.trim().length === 0) {
      throw new Error('Failed to process - URL cannot be empty')
    } else if (connection.client !== undefined) {
      throw new Error(
        'Failed to process - Client was already subscribed to the specific channel. You can unsubscribe and resubscribe again to different channel'
      )
    }

    connection.client = new WebSocket(url)
    return connection
  },
})

/**
 * @typedef {() => void} UnsubscribeType
 */

/**
 * @param {{ client: EventSource | undefined }} connection - Object with EventSource client
 * @returns {{ unsubscribe: UnsubscribeType }} Returns an object with unsubscribe method
 */
const unsubscribeFromSse = (connection) => ({
  /** @type {UnsubscribeType} */
  unsubscribe: () => {
    if (connection.client instanceof EventSource) {
      connection.client.close()
      connection.client = undefined
    }
    return
  },
})

/**
 * @param {{ client: WebSocket | undefined }} connection - Object with WebSocket client
 * @returns {{ unsubscribe: UnsubscribeType }} Returns an object with unsubscribe method
 */
const unsubscribeFromWebSocket = (connection) => ({
  /** @type {UnsubscribeType} */
  unsubscribe: () => {
    if (connection.client instanceof WebSocket) {
      connection.client.close()
      connection.client = undefined
    }
    return
  },
})

/**
 * Listen to the open event
 *
 * @typedef {(callback: Function) => void} OnOpenType
 */

/**
 * @param {{ client: EventTarget | undefined }} connection - Object with client instance of EventTarget
 * @returns {{ onOpen: OnOpenType }} Returns an object with onOpen method
 */
const onOpen = (connection) => ({
  /** @type {OnOpenType} */
  onOpen: (callback) => {
    if (
      connection.client instanceof EventTarget &&
      callback instanceof Function
    ) {
      connection.client.addEventListener('open', (event) => {
        callback(event)
      })
    }
  },
})

/**
 * Listen to the error event
 *
 * @typedef {(callback: Function) => void} OnErrorType
 */

/**
 * @param {{ client: EventTarget | undefined }} connection - Object with client instance of EventTarget
 * @returns {{ onError: OnErrorType }} Returns an object with onError method
 */
const onError = (connection) => ({
  /** @type {OnErrorType} */
  onError: (callback) => {
    if (
      connection.client instanceof EventTarget &&
      callback instanceof Function
    ) {
      connection.client.addEventListener('error', (event) => {
        callback(event)
      })
    }
  },
})

/**
 * Listen to the message event
 *
 * @typedef {(callback: Function) => void} OnMessageType
 */

/**
 * @typedef EventDataType
 * @property {string} [data] - The string data received from the server sent event
 * @typedef {Event & EventDataType} MessageEventType
 */

/**
 * @param {{ client: EventTarget | undefined }} connection - Object with client instance of EventTarget
 * @returns {{ onMessage: OnMessageType }} Returns an object with onMessage method
 */
const onMessage = (connection) => ({
  /** @type {OnMessageType} */
  onMessage: (callback) => {
    if (
      connection.client instanceof EventTarget &&
      callback instanceof Function
    ) {
      connection.client.addEventListener(
        'message',
        /** @param {MessageEventType} event - The message event object with additional data property */
        (event) => {
          if (event.data) {
            let data = JSON.parse(event.data)
            data = typeof data === 'object' ? data : {}
            callback(
              camelcaseKeys(data, {
                deep: true,
              })
            )
          }
        }
      )
    }
  },
})

/**
 * Publish the data to the stream channel server
 *
 * @typedef {(url: string, data: object) => void} PublishType
 */

/**
 * @returns {{ publish: PublishType }} Returns an object with publish method
 */
const publish = () => ({
  /** @type {PublishType} */
  publish: async (url, data) => {
    if (typeof url !== 'string' || url.trim().length === 0) {
      throw new Error('Failed to process - Please provide the URL')
    } else if (!data) {
      throw new Error(
        'Failed to process - Please provide the data that wants to be published'
      )
    } else if (typeof data !== 'object') {
      throw new TypeError(
        'Failed to process - Data must be in an object format'
      )
    }

    const response = await fetchHttp({
      url,
      method: 'POST',
      body: snakecaseKeys(data),
    })

    return response
  },
})

/**
 * @typedef SSEChannelType
 * @property {SubscribeToSseType} subscribe - Subscribe method
 * @property {UnsubscribeType} unsubscribe - Unsubscribe method
 * @property {OnOpenType} onOpen - onOpen method
 * @property {OnErrorType} onError - onError method
 * @property {OnMessageType} onMessage - onMessage method
 * @property {PublishType} publish - publish method
 */

/**
 * @returns {SSEChannelType} Returns methods to handle SSE connection
 */
const sse = () => {
  let connection = {
    client: undefined,
  }

  return Object.assign(
    {},
    subscribeToSse(connection),
    unsubscribeFromSse(connection),
    onOpen(connection),
    onError(connection),
    onMessage(connection),
    publish()
  )
}

/**
 * @typedef WebSocketChannelType
 * @property {SubscribeToWebSocketType} subscribe - Subscribe method
 * @property {UnsubscribeType} unsubscribe - Unsubscribe method
 * @property {OnOpenType} onOpen - onOpen method
 * @property {OnErrorType} onError - onError method
 * @property {OnMessageType} onMessage - onMessage method
 */

/**
 * @returns {WebSocketChannelType} Returns methods to handle WebSocket connection
 */
const websocket = () => {
  let connection = {
    client: undefined,
  }

  return Object.assign(
    {},
    subscribeToWebSocket(connection),
    unsubscribeFromWebSocket(connection),
    onOpen(connection),
    onError(connection),
    onMessage(connection)
  )
}

export { sse, websocket }
