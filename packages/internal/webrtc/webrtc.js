import { event } from '../../event/event.js'
import { webrtc as webrtcConfig } from '../config/webrtc.js'

const webrtc = (() => {
  /**
   * ======================================================
   *  Variables
   * ======================================================
   */

  const { iceServers } = webrtcConfig

  /**
   * ======================================================
   *  Functions
   * ======================================================
   */

  /**
   * Open and create a new peer connection
   * @returns {RTCPeerConnection} Returns a new RTCPeerConnection object
   */
  const openConnection = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: iceServers,
    })

    return peerConnection
  }

  /**
   * @param {RTCPeerConnection | null} peerConnection - The RTCPeerConnection object
   * @returns {void}
   */
  const closeConnection = (peerConnection) => {
    if (!(peerConnection instanceof RTCPeerConnection)) {
      throw new TypeError(
        'Failed to process - Peer connection object is missing'
      )
    }

    peerConnection.close()
    peerConnection = null
  }

  /**
   * Create a local offer and gather ICE connection
   * @param {RTCPeerConnection | null} peerConnection - The RTCPeerConnection object
   */
  const createLocalOffer = async (peerConnection) => {
    if (!(peerConnection instanceof RTCPeerConnection)) {
      throw new TypeError(
        'Failed to process - Peer connection object is missing'
      )
    }

    peerConnection.addEventListener('iceconnectionstatechange', () => {
      event.publish('stream:ice-connection-state-change-event', {
        type: 'stream:ice-connection-state-change-event',
        detail: {
          connectionState: peerConnection.connectionState,
          iceConnectionState: peerConnection.iceConnectionState,
        },
      })
    })

    const iceGatheringPromise = new Promise((resolve) => {
      /** @type {ReturnType<typeof setTimeout>} */
      let iceGatheringTimeout
      let isOfferSent = false

      if (peerConnection) {
        peerConnection.addEventListener('icecandidate', (event) => {
          if (event.candidate === null && !isOfferSent) {
            clearTimeout(iceGatheringTimeout)
            isOfferSent = true
            resolve(event)
          } else {
            iceGatheringTimeout = setTimeout(() => {
              if (!isOfferSent) {
                clearTimeout(iceGatheringTimeout)
                isOfferSent = true
                resolve(event)
              }
            }, 1000)
          }
        })
      }
    })

    const localOffer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(localOffer)
    await iceGatheringPromise
  }

  /**
   *
   * @param {RTCPeerConnection | null} peerConnection - The RTCPeerConnection object
   * @param {RTCSessionDescription} remoteSessionDescription - The remote answer SDP offer received from the init API endpoint
   */
  const setRemoteOffer = (peerConnection, remoteSessionDescription) => {
    if (peerConnection && remoteSessionDescription) {
      const asnwerSDP = new RTCSessionDescription(remoteSessionDescription)
      peerConnection.setRemoteDescription(asnwerSDP)
    }
  }

  return {
    closeConnection,
    createLocalOffer,
    openConnection,
    setRemoteOffer,
  }
})()

Object.freeze(webrtc)

export { webrtc }
