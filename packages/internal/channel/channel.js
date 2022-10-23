import { fetchHttp } from '../fetch-http/fetch-http.js'

/**
 * @typedef {(url: string) => EventSource | void} SubscribeToSseType
 */

/**
 * @param {EventSource | undefined} client - The client EventSource object
 * @returns {{ subscribe: SubscribeToSseType }} Returns an object with subscribe method
 */
const subscribeToSse = (client) => ({
  /** @type {SubscribeToSseType} */
  subscribe: (url) => {
    if (typeof url !== 'string') {
      throw new TypeError('Failed to process - URL must be a string')
    } else if (url.trim().length === 0) {
      throw new Error('Failed to process - URL cannot be empty')
    } else if (client !== undefined) {
      throw new Error(
        'Failed to process - Client was already subscribed to the specific channel. You can unsubscribe and resubscribe again to different channel'
      )
    }

    client = new EventSource(url)
    return client
  },
})

/**
 * @typedef {(url: string) => WebSocket | void} SubscribeToWebSocketType
 */

/**
 * @param {WebSocket | undefined} client - The client WebSocket object
 * @returns {{ subscribe: SubscribeToWebSocketType }} - Returns an object with subscribe method
 */
const subscribeToWebSocket = (client) => ({
  /** @type {SubscribeToWebSocketType} */
  subscribe: (url) => {
    if (typeof url !== 'string') {
      throw new TypeError('Failed to process - URL must be a string')
    } else if (url.trim().length === 0) {
      throw new Error('Failed to process - URL cannot be empty')
    } else if (client !== undefined) {
      throw new Error(
        'Failed to process - Client was already subscribed to the specific channel. You can unsubscribe and resubscribe again to different channel'
      )
    }

    client = new WebSocket(url)
    return client
  },
})

/**
 * @typedef {() => void} UnsubscribeType
 */

/**
 * @param {EventSource | undefined} client - The client EventSource object
 * @returns {{ unsubscribe: UnsubscribeType }} Returns an object with unsubscribe method
 */
const unsubscribeFromSse = (client) => ({
  /** @type {UnsubscribeType} */
  unsubscribe: () => {
    if (client instanceof EventSource) {
      client.close()
      client = undefined
    }
    return
  },
})

/**
 * @param {WebSocket | undefined} client - The client WebSocket object
 * @returns {{ unsubscribe: UnsubscribeType }} Returns an object with unsubscribe method
 */
const unsubscribeFromWebSocket = (client) => ({
  /** @type {UnsubscribeType} */
  unsubscribe: () => {
    if (client instanceof WebSocket) {
      client.close()
      client = undefined
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
 * @param {EventTarget | undefined} client - The client object
 * @returns {{ onOpen: OnOpenType }} Returns an object with onOpen method
 */
const onOpen = (client) => ({
  /** @type {OnOpenType} */
  onOpen: (callback) => {
    if (client instanceof EventTarget && callback instanceof Function) {
      client.addEventListener('open', (event) => {
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
 * @param {EventTarget | undefined} client - The client object
 * @returns {{ onError: OnErrorType }} Returns an object with onError method
 */
const onError = (client) => ({
  /** @type {OnErrorType} */
  onError: (callback) => {
    if (client instanceof EventTarget && callback instanceof Function) {
      client.addEventListener('error', (event) => {
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
 * @typedef {Event & EventDataType} CustomEventType
 */

/**
 * @param {EventTarget | undefined} client - The client object
 * @returns {{ onMessage: OnMessageType }} Returns an object with onMessage method
 */
const onMessage = (client) => ({
  /** @type {OnMessageType} */
  onMessage: (callback) => {
    if (client instanceof EventTarget && callback instanceof Function) {
      client.addEventListener(
        'message',
        /** @param {CustomEventType} event - The Event Object with additional data property */
        (event) => {
          if (event.data) {
            let data = JSON.parse(event.data)
            data = typeof data === 'object' ? data : {}
            callback(data)
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

    const response = await fetchHttp({ url, method: 'POST', body: data })
    return response
  },
})

/**
 * @returns {{
 *  subscribe: SubscribeToSseType,
 *  unsubscribe: UnsubscribeType,
 *  onOpen: OnOpenType,
 *  onError: OnErrorType,
 *  onMessage: OnMessageType,
 *  publish: PublishType
 * }} Returns methods to handle SSE connection
 */
const sse = () => {
  let client
  return Object.assign(
    {},
    subscribeToSse(client),
    unsubscribeFromSse(client),
    onOpen(client),
    onError(client),
    onMessage(client),
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
  let client
  return Object.assign(
    {},
    subscribeToWebSocket(client),
    unsubscribeFromWebSocket(client),
    onOpen(client),
    onError(client),
    onMessage(client)
  )
}

export { sse, websocket }
