import { sse } from '../../internal/channel/channel.js'
import { sse as sseConfig } from '../../internal/config/sse.js'
import { InliveEvent } from '../../index.js'
import { makeWidgetElement } from '../element/element.js'

/**
 * @typedef WidgetConfigType
 * @property {string} [channelOrigin] - Stream channel server origin
 * @property {number} streamId - The ID of the stream
 * @property {string} widgetKey - The widget key
 */

/**
 * @typedef InitialSubscriptionDataType
 * @property {object} message - A message object contains the actual message data
 * @property {string} message.token - Temporary token
 * @property {string} message.userId - Temporary user ID
 * @property {number} message.viewerCount - Total of current viewer counts
 * @property {number} streamId - The ID of the stream
 * @property {string} type - The type of the event
 */

/**
 * @typedef WidgetInternalDataType
 * @property {InitialSubscriptionDataType} initialSubscription - Initial subscription data from channel
 */

/**
 * @typedef {import('../../internal/channel/channel.js').SSEChannelType} ChannelClientType
 */

/**
 * @typedef {import('../../event/event.js').EventType} EventType
 */

/**
 * @typedef {() => Promise<WidgetInternalDataType>} OpenChannelType
 */

/**
 * @callback HandleConnectToChannelType
 * @param {ChannelClientType} channelClient - The channel client
 * @param {string} subscribeUrl - The URL for subscribe to the channel
 * @returns {Promise<InitialSubscriptionDataType>}
 */

const channelClient = sse()

/**
 * @typedef {() => Promise<WidgetInternalDataType>} ConnectToChannelType
 */

/**
 * @callback MakeChannelConnectionType
 * @param {ChannelClientType} channelClient - The channel client
 * @param {HandleConnectToChannelType} handleConnectToChannel - Callback method to handle connecting to the channel
 * @returns {(subscribeUrl: string, data: WidgetInternalDataType) =>
 * { connectToChannel: ConnectToChannelType }} Returns a function that returns a connectToChannel method
 */

/** @type {MakeChannelConnectionType} */
const makeChannelConnection =
  (channelClient, handleConnectToChannel) => (subscribeUrl, data) => {
    return {
      /** @type {ConnectToChannelType} */
      async connectToChannel() {
        const newData = await handleConnectToChannel(
          channelClient,
          subscribeUrl
        )

        data.initialSubscription = {
          ...data.initialSubscription,
          ...(typeof newData === 'object' ? newData : {}),
        }

        return data
      },
    }
  }

/** @type {HandleConnectToChannelType} */
const handleConnectToChannel = async (channelClient, subscribeUrl) => {
  const channelPromise = new Promise((resolve, reject) => {
    try {
      channelClient.subscribe(subscribeUrl)

      channelClient.onMessage((/** @type {any} */ message = {}) => {
        let data = {}
        if (message.type === 'init') {
          const streamId = Number.parseInt(message.streamId, 10)

          data = {
            ...message,
            streamId: streamId,
          }
        }
        resolve(data)
      })
    } catch (error) {
      reject(error)
    }
  })

  const data = await channelPromise
  return data
}

/**
 * @typedef WidgetMetaData
 * @property {string} name - The widget name
 * @property {string} description - The widget description
 * @property {Function} widget - Widget element callback function
 */

/**
 * @typedef {(config: { widgetKey: string, widgets: WidgetMetaData[] }) => void} RegisterType
 */

/**
 * @callback MakeWidgetRegistrationType
 * @param {ChannelClientType} channelClient - The channel client
 * @param {typeof import('../element/element.js').makeWidgetElement} makeWidgetElement - The factory function to make the widget element
 * @param {EventType} InliveEvent - The inlive event module
 * @returns {(baseConfig: WidgetConfigType, data: WidgetInternalDataType) =>
 * { register: RegisterType }} Returns a function that returns a connectToChannel method
 */

/** @type {MakeWidgetRegistrationType} */
const makeWidgetRegistration =
  (channelClient, makeWidgetElement, InliveEvent) => (baseConfig, data) => {
    return {
      /** @type {RegisterType} */
      register(config) {
        const defaultConfig = config || {}

        const newConfig = {
          widgetKey: defaultConfig.widgetKey || baseConfig.widgetKey,
          widgets: Array.isArray(defaultConfig.widgets)
            ? defaultConfig.widgets
            : [],
        }

        if (!newConfig.widgetKey) {
          throw new Error('Failed to process - widget key is required')
        } else if (typeof newConfig.widgetKey !== 'string') {
          throw new TypeError(
            'Failed to process - widget key must be in a string format'
          )
        }

        for (const widgetMetaData of newConfig.widgets) {
          if (typeof widgetMetaData.name !== 'string') {
            throw new TypeError('Failed to process - name must be a string')
          } else if (widgetMetaData.name.trim().length === 0) {
            throw new Error(
              'Failed to process - name is required and cannot be empty'
            )
          } else if (!widgetMetaData.widget) {
            throw new Error(
              'Failed to process - widget is required and cannot be empty'
            )
          }

          const initialData = data.initialSubscription || {}
          const messageData = initialData.message || {}
          const metaData = widgetMetaData

          const newData = {
            channel: channelClient,
            event: InliveEvent,
            publishUrl: `${baseConfig.channelOrigin}/publish/${initialData.streamId}?token=${messageData.token}`,
            streamId: initialData.streamId,
            userId: messageData.userId,
            viewerCount: messageData.viewerCount,
            widgetKey: newConfig.widgetKey,
          }

          metaData.widget(makeWidgetElement(newData))
        }
      },
    }
  }

/**
 * @typedef WidgetMethodsType
 * @property {ConnectToChannelType} connectToChannel - Connect to channel method
 * @property {RegisterType} register - Widget registration method
 */

/**
 * @callback makeClientType
 * @param {{ connectToChannel: ConnectToChannelType }} channelConnection - An object with connectToChannel method
 * @param {{ register: RegisterType }} widgetRegistration - An object with widget registration method
 * @returns {WidgetMethodsType} Returns the merged object
 */

/** @type {makeClientType} */
const makeClient = (channelConnection, widgetRegistration) => {
  return Object.assign({}, channelConnection, widgetRegistration)
}

/**
 *
 * @param {(subscribeUrl: string, data: WidgetInternalDataType) =>
 * { connectToChannel: ConnectToChannelType }} makeChannelConnection - Channel connection factory function
 * @param {makeClientType} makeClient - Client factory function
 * @param {(baseConfig: WidgetConfigType, data: WidgetInternalDataType) =>
 * { register: RegisterType }} makeWidgetRegistration - Widget registration factory function
 * @returns {(config: WidgetConfigType) => WidgetMethodsType} Returns the widget methods
 */
const makeWidgetClient = (
  makeChannelConnection,
  makeClient,
  makeWidgetRegistration
) => {
  return (config) => {
    const defaultConfig = {
      channelOrigin: sseConfig.baseUrl,
      streamId: 0,
      widgetKey: '',
    }

    const baseConfig = {
      channelOrigin: defaultConfig.channelOrigin,
      streamId: defaultConfig.streamId,
      widgetKey: defaultConfig.widgetKey,
      ...(typeof config === 'object' ? config : {}),
    }

    if (!baseConfig.streamId) {
      throw new Error('Failed to process - please provide a valid stream ID')
    } else if (typeof baseConfig.streamId !== 'number') {
      throw new TypeError(
        'Failed to process - stream ID is not in a number format'
      )
    } else if (!baseConfig.widgetKey) {
      throw new Error('Failed to process - widget key is required')
    } else if (typeof baseConfig.widgetKey !== 'string') {
      throw new TypeError(
        'Failed to process - widget key must be in a string format'
      )
    }

    const data = {
      initialSubscription: {
        message: {
          token: '',
          userId: '',
          viewerCount: 0,
        },
        type: 'init',
        streamId: baseConfig.streamId,
      },
    }

    const subscribeUrl = `${baseConfig.channelOrigin}/subscribe/${baseConfig.streamId}`
    const channelConnection = makeChannelConnection(subscribeUrl, data)
    const widgetRegistration = makeWidgetRegistration(baseConfig, data)

    return makeClient(channelConnection, widgetRegistration)
  }
}

const client = makeWidgetClient(
  makeChannelConnection(channelClient, handleConnectToChannel),
  makeClient,
  makeWidgetRegistration(channelClient, makeWidgetElement, InliveEvent)
)

export { client }
