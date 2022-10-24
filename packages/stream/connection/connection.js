import camelcaseKeys from 'camelcase-keys'
import { websocket as websocketConfig } from '../../internal/config/websocket.js'
import { Internal } from '../../internal/index.js'
import { InliveEvent } from '../../event/index.js'

const { websocket, webrtc } = Internal

/**
 * @typedef ICEConnectionStateChangeEvent
 * @property {string} type - The type of the event
 * @property {object} detail - The detail data sent through event
 * @property {string} detail.connectionState - The current connection state of the peer connection
 * @property {string} detail.iceConnectionState - The current ice agent connection state
 */

/**
 * Manage the client connection
 */
const connection = (() => {
  let isPodReady = false

  InliveEvent.subscribe(
    'stream:ice-connection-state-change-event',
    /** @param {ICEConnectionStateChangeEvent} data - The object data sent by the publisher method */
    (data) => {
      const { detail } = data

      if (detail && detail.iceConnectionState) {
        const { iceConnectionState } = detail

        switch (iceConnectionState) {
          case 'connected': {
            InliveEvent.publish('stream:ready-to-start-event', {
              type: 'stream:ready-to-start-event',
              detail: {
                ready: true,
                message: 'Ready to start a live streaming',
              },
            })
            break
          }
          default: {
            break
          }
        }
      }
    }
  )

  /**
   * Open the channel connection to listen to the stream events
   *
   * @param {number} streamId - The ID of the stream
   * @returns {import('../../internal/channel/channel.js').WebSocketChannelType} The websocket  client from channel module
   */
  const openChannelConnection = (streamId) => {
    const websocketClient = websocket()

    const baseUrl = `${websocketConfig.baseUrl}/${websocketConfig.version}`
    const subscribeUrl = `${baseUrl}/streams/${streamId}/websocket`
    websocketClient.subscribe(subscribeUrl)

    /**
     * @typedef WebSocketDataType
     * @property {string} type - The type of the event
     * @property {string} eventName - The name of the event
     */

    websocketClient.onMessage(
      /** @param {WebSocketDataType} rawData - Data received from the channel */
      async (rawData) => {
        const data = camelcaseKeys(rawData)

        if (data.type === 'pod' && data.eventName === 'ready') {
          if (!isPodReady) {
            isPodReady = true
            InliveEvent.publish('stream:ready-to-initialize-event', {
              type: 'stream:ready-to-initialize-event',
              detail: {
                ready: true,
                message: 'The stream is ready to be initialized',
              },
            })
          }
        } else if (data.type === 'pod' && data.eventName === 'killed') {
          isPodReady = false
          InliveEvent.publish('stream:session-closed-event', {
            type: 'stream:session-closed-event',
            detail: {
              closed: true,
              message: 'The stream session is closed',
            },
          })
        } else if (data.type === 'stream' && data.eventName === 'start') {
          InliveEvent.publish('stream:start-event', {
            type: 'stream:start-event',
            detail: {
              start: true,
              message: 'The stream has successfully started',
            },
          })
        } else if (data.type === 'stream' && data.eventName === 'end') {
          InliveEvent.publish('stream:end-event', {
            type: 'stream:end-event',
            detail: {
              end: true,
              message: 'The stream has successfully ended',
            },
          })
        }
      }
    )

    return websocketClient
  }

  /**
   *
   * @param {import('../../internal/channel/channel.js').WebSocketChannelType} websocketClient - The websocket client
   */
  const closeChannelConnection = (websocketClient) => {
    if (websocketClient && websocketClient.unsubscribe) {
      websocketClient.unsubscribe()
    }
  }

  /**
   *
   * @param {MediaStream} mediaStream - The media stream object
   * @returns {Promise<RTCPeerConnection>} Returns a new promise that contains the RTCPeerConnection object
   */
  const openWebrtcConnection = async (mediaStream) => {
    const peerConnection = webrtc.openConnection()

    for (const track of mediaStream.getTracks()) {
      peerConnection.addTrack(track, mediaStream)
    }

    await webrtc.createLocalOffer(peerConnection)

    return peerConnection
  }

  /**
   *
   * @param {RTCPeerConnection | null} peerConnection - The RTCPeerConnection object
   * @param {HTMLVideoElement} mediaElement - HTML video element object
   */
  const closeWebrtcConnection = (peerConnection, mediaElement) => {
    if (!(peerConnection instanceof RTCPeerConnection)) {
      throw new TypeError('Failed to process - Missing peer connection object')
    }

    if (mediaElement && mediaElement.srcObject instanceof MediaStream) {
      for (const track of mediaElement.srcObject.getTracks()) {
        track.stop()
      }
    }

    webrtc.closeConnection(peerConnection)
  }

  /**
   * @typedef {(eventName: string, callback: Function) => void} OnEventType
   */

  /**
   * @returns {{on: OnEventType}} - Returns an object with an on method
   */
  const on = () => ({
    /** @type {OnEventType} */
    on: (eventName, callback) => {
      InliveEvent.subscribe(eventName, () => {
        callback()
      })
    },
  })

  /**
   * @typedef {(remoteSessionDescription: RTCSessionDescription) =>  void} ConnectType
   */

  /**
   * @param {RTCPeerConnection} peerConnection - The RTCPeerConnection object
   * @returns {{connect: ConnectType}} - Returns an object with a connect method
   */
  const connect = (peerConnection) => {
    if (!(peerConnection instanceof RTCPeerConnection)) {
      throw new TypeError(
        'Failed to process - Peer connection object is missing'
      )
    }

    return {
      /** @type {ConnectType} */
      connect: (remoteSessionDescription) => {
        if (!(remoteSessionDescription instanceof RTCSessionDescription)) {
          throw new TypeError(
            'Failed to process - Invalid session description format'
          )
        }

        webrtc.setRemoteOffer(peerConnection, remoteSessionDescription)
      },
    }
  }

  /**
   * @typedef {() => RTCPeerConnection | null} GetPeerConnectionType
   */

  /**
   * @param {RTCPeerConnection} peerConnection - The RTCPeerConnection object
   * @returns {{ getPeerConnection: GetPeerConnectionType }} - Returns a RTCPeerConnection object
   */
  const getPeerConnection = (peerConnection) => ({
    /** @type {GetPeerConnectionType} */
    getPeerConnection: () => peerConnection,
  })

  /**
   * @typedef {() =>  void} CloseConnectionType
   */

  /**
   *
   * @param {RTCPeerConnection} peerConnection - The RTCPeerConnection object
   * @param {HTMLVideoElement} mediaElement - The video media element
   * @param {import('../../internal/channel/channel.js').WebSocketChannelType} websocketClient - The websocket client from channel module
   * @returns {{close: CloseConnectionType}} - Returns an object with a close method
   */
  const close = (peerConnection, mediaElement, websocketClient) => ({
    /** @type {CloseConnectionType} */
    close: () => {
      closeChannelConnection(websocketClient)
      closeWebrtcConnection(peerConnection, mediaElement)
    },
  })

  /**
   * @typedef MediaObject
   * @property {number} streamId - The ID of the stream
   * @property {MediaStream} mediaStream - The media element object
   * @property {HTMLVideoElement} mediaElement - HTML video element object
   */

  /**
   * Open the client connnection
   *
   * @param {MediaObject} mediaObject - The media object consists of the ID of the stream, media video element and media stream object
   */
  const open = async (mediaObject) => {
    const { streamId, mediaElement, mediaStream } = mediaObject

    if (streamId === null || streamId === undefined) {
      throw new Error('Failed to process - ID of the stream is empty')
    } else if (typeof streamId !== 'number') {
      throw new TypeError(
        'Failed to process - ID of the stream is not in a number format'
      )
    } else if (!(mediaStream instanceof MediaStream)) {
      throw new TypeError('Failed to process - Wrong media stream format')
    } else if (!(mediaElement instanceof HTMLVideoElement)) {
      throw new TypeError('Failed to process - Wrong media element format')
    } else if (!mediaElement.srcObject) {
      throw new Error('Failed to process - Missing data on media element')
    }

    const websocketClient = openChannelConnection(streamId)
    const peerConnection = await openWebrtcConnection(mediaStream)

    return Object.assign(
      {},
      close(peerConnection, mediaElement, websocketClient),
      connect(peerConnection),
      getPeerConnection(peerConnection),
      on()
    )
  }

  return {
    open,
  }
})()

Object.freeze(connection)

export { connection }
