import camelcaseKeys from 'camelcase-keys'
import { Internal } from '../../internal/index.js'

const { webrtc } = Internal

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
   */
  const closeWebrtcConnection = (peerConnection) => {
    if (!(peerConnection instanceof RTCPeerConnection)) {
      throw new TypeError('Failed to process - Missing peer connection object')
    }

    webrtc.closeConnection(peerConnection)
  }

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
        if (
          !remoteSessionDescription ||
          !remoteSessionDescription.type ||
          !remoteSessionDescription.sdp
        ) {
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
   * @returns {{close: CloseConnectionType}} - Returns an object with a close method
   */
  const close = (peerConnection) => ({
    /** @type {CloseConnectionType} */
    close: () => {
      closeWebrtcConnection(peerConnection)
    },
  })

  /**
   * @typedef MediaObject
   * @property {number} streamId - The ID of the stream
   * @property {?MediaStream} mediaStream - The media element object
   */

  /**
   * Open the client connnection
   *
   * @param {MediaObject} mediaObject - The media object consists of the ID of the stream, media video element and media stream object
   */
  const open = async (mediaObject) => {
    const { streamId, mediaStream } = mediaObject

    if (streamId === null || streamId === undefined) {
      throw new Error('Failed to process - ID of the stream is empty')
    } else if (typeof streamId !== 'number') {
      throw new TypeError(
        'Failed to process - ID of the stream is not in a number format'
      )
    } else if (!(mediaStream instanceof MediaStream)) {
      throw new TypeError('Failed to process - Wrong media stream format')
    }

    const peerConnection = await openWebrtcConnection(mediaStream)

    return Object.assign(
      {},
      close(peerConnection),
      connect(peerConnection),
      getPeerConnection(peerConnection)
    )
  }

  return {
    open,
  }
})()

Object.freeze(connection)

export { connection }
