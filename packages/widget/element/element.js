import { LitElement } from 'lit'

/**
 * @typedef {import('../../internal/channel/channel.js').SSEChannelType} ChannelClientType
 */

/**
 * @typedef {import('../../event/event.js').EventType} EventType
 */

/**
 * @typedef InitialDataType
 * @property {ChannelClientType} channel - The client channel module
 * @property {EventType} event - The event module
 * @property {string} publishUrl - Channel server publish endpoint URL
 * @property {number} streamId - The ID of the stream
 * @property {string} userId - The temporary ID of the user
 * @property {number} viewerCount - The current total of viewer count
 * @property {string} widgetKey - The widget key
 */

/**
 *
 * @param {typeof import('lit').LitElement} BaseElement - The base element for the widget element
 * @returns {(initialData: InitialDataType) => any} Returns the element that inherits the LitElement instance
 */
const widgetElementTemplate = (BaseElement) => (initialData) => {
  class WidgetElement extends BaseElement {
    static properties = {
      viewerCount: { type: Number },
    }

    /**
     * Widget constructor method
     */
    constructor() {
      super()
      /** @type {ChannelClientType} */
      this.channel = initialData.channel
      /** @type {EventType} */
      this.event = initialData.event
      /** @type {string} */
      this.publishUrl = initialData.publishUrl
      /** @type {number} */
      this.streamId = initialData.streamId
      /** @type {string} */
      this.userId = initialData.userId
      /** @type {number} */
      this.viewerCount = initialData.viewerCount
      /** @type {string} */
      this._widgetKey = initialData.widgetKey
    }

    /**
     * Widget connectedCallback method
     */
    connectedCallback() {
      super.connectedCallback()

      this.channel.onMessage((/** @type {Object<any, any>} */ detail = {}) => {
        if (detail.type === 'init') return

        if (
          detail.type === 'system' &&
          detail.message &&
          detail.message.status === 'join'
        ) {
          this.handleUserJoin()
        } else if (
          detail.type === 'system' &&
          detail.message &&
          detail.message.status === 'leave'
        ) {
          this.handleUserLeave()
        }
      })
    }

    /**
     *
     */
    handleUserJoin() {
      this.viewerCount++
    }

    /**
     *
     */
    handleUserLeave() {
      if (this.viewerCount > 0) {
        this.viewerCount--
      }
    }

    /**
     * @typedef SendBroadcastType
     * @property {object} message - Put the actual data and broadcast it as a message
     * @property {number} [timestamp] - The current video player timestamp
     */

    /**
     * Method to broadcast a message to all clients
     *
     * @param {SendBroadcastType} input - The broadcast input
     */
    async sendBroadcast(input) {
      const defaultData = {
        message: {},
        timestamp: 0,
      }

      const data = {
        message: defaultData.message,
        timestamp: defaultData.timestamp,
        widgetKey: this._widgetKey,
        type: 'broadcast',
        ...(typeof input === 'object' ? input : {}),
      }

      return await this.channel.publish(this.publishUrl, data)
    }

    /**
     * Method to get the history of broadcasted message
     */
    async getBroadcastHistory() {
      const defaultData = {
        timestamp: 0,
      }

      const data = {
        timestamp: defaultData.timestamp,
        widgetKey: this._widgetKey,
        type: 'request',
      }

      return await this.channel.publish(this.publishUrl, data)
    }
  }

  return WidgetElement
}

export const makeWidgetElement = widgetElementTemplate(LitElement)