import { event } from '../../event/event.js'
import { webrtc as webrtcConfig } from '../config/webrtc.js'

/**
 * @typedef VideoOptions
 * @property {boolean} muted - Set the autoplay setting on the video element
 * @property {boolean} autoplay - Set the muted setting on the video element
 * @property {boolean} playsInline - Set the playsInline setting on the video element
 */

/**
 * @typedef MediaObject media
 * @property {string} videoSelector - The valid selector for video element
 * @property {VideoOptions} [videoOptions] - The video options
 * @property {object} [videoConstraints] - The media stream constraints for the video
 */

/**
 * @typedef {'preparing' | 'connecting' | 'ready' | 'live' | 'end'} ClientState - The current state of the WebRTC client
 */

const webrtc = (() => {
  /**
   * ======================================================
   *  Variables
   * ======================================================
   */

  /** @type {object} - The object which specifies the media type constraints */
  const defaultConstraints = {
    video: {
      frameRate: 30,
      width: { min: 640, ideal: 1280, max: 1280 },
      height: { min: 360, ideal: 720, max: 720 },
    },
    audio: true,
  }

  const { iceServers } = webrtcConfig

  /** @type {ClientState} */
  let clientState = 'preparing'

  /** @type {MediaStream} */
  let mediaStream

  /** @type {HTMLVideoElement} */
  let mediaElement

  /** @type {RTCPeerConnection | null} */
  let peerConnection

  /**
   * ======================================================
   *  Functions
   * ======================================================
   */

  /**
   *
   * @param {MediaObject} media - The media object argument
   */
  const setMediaStream = async (media) => {
    const mediaObject = {
      videoSelector: media.videoSelector || 'video',
      videoOptions: {
        autoplay:
          media.videoOptions && typeof media.videoOptions.autoplay === 'boolean'
            ? media.videoOptions.autoplay
            : true,
        muted:
          media.videoOptions && typeof media.videoOptions.muted === 'boolean'
            ? media.videoOptions.muted
            : true,
        playsInline:
          media.videoOptions &&
          typeof media.videoOptions.playsInline === 'boolean'
            ? media.videoOptions.playsInline
            : true,
      },
      videoConstraints: media.videoConstraints || defaultConstraints,
    }

    mediaStream = await navigator.mediaDevices.getUserMedia(
      mediaObject.videoConstraints
    )

    const { videoSelector, videoOptions } = mediaObject

    if (videoSelector) {
      const element = document.querySelector(videoSelector)
      const isVideoElement = element instanceof HTMLVideoElement
      if (isVideoElement) {
        mediaElement = element
        mediaElement.srcObject = mediaStream
        mediaElement.autoplay = videoOptions.autoplay
        mediaElement.muted = videoOptions.muted
        mediaElement.playsInline = videoOptions.playsInline
      } else {
        throw new Error(
          'Failed to process because the video element could not be found by using that selector. Please use a valid selector for the video element and ensure the video element already exists'
        )
      }
    }
  }

  /**
   * Open the peer connection
   *
   * @returns {Promise<RTCPeerConnection>} Returns a new RTCPeerConnection object
   */
  const openConnection = async () => {
    if (!peerConnection) {
      peerConnection = new RTCPeerConnection({
        iceServers,
      })

      await createLocalOffer()
    }

    return peerConnection
  }

  /**
   * @returns {RTCPeerConnection | null} Returns the current state of RTCPeerConnection object
   */
  const getConnection = () => peerConnection || null

  /**
   *
   * @returns {void}
   */
  const closeConnection = () => {
    if (peerConnection) {
      if (mediaElement && mediaElement.srcObject instanceof MediaStream) {
        for (const track of mediaElement.srcObject.getTracks()) {
          track.stop()
        }
      }
      peerConnection.close()
      peerConnection = null
    }
  }

  /**
   * Create a local offer and gather ICE connection
   */
  const createLocalOffer = async () => {
    if (peerConnection) {
      for (const track of mediaStream.getTracks()) {
        peerConnection.addTrack(track, mediaStream)
      }

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

      peerConnection.addEventListener('iceconnectionstatechange', () => {
        if (peerConnection && peerConnection.iceConnectionState) {
          event.publish('stream:ice-connection-state-change-event', {
            type: 'stream:ice-connection-state-change-event',
            detail: {
              iceConnectionState: peerConnection.iceConnectionState,
            },
          })
        }
      })

      const localOffer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(localOffer)
      await iceGatheringPromise
    }
  }

  /**
   *
   * @returns {ClientState} Returns the current client state
   */
  const getClientState = () => clientState

  /**
   *
   * @param {ClientState} newState - The new string state
   * @returns {ClientState} Returns the modified client state
   */
  const setClientState = (newState) =>
    newState ? (clientState = newState) : clientState

  /**
   *
   * @param {RTCSessionDescription} answerOffer - The answer offer received from the init API endpoint
   */
  const setRemoteOffer = (answerOffer) => {
    if (peerConnection) {
      const asnwerSDP = new RTCSessionDescription(answerOffer)
      peerConnection.setRemoteDescription(asnwerSDP)
    }
  }

  return {
    closeConnection,
    getClientState,
    getConnection,
    openConnection,
    setClientState,
    setMediaStream,
    setRemoteOffer,
  }
})()

Object.freeze(webrtc)

export { webrtc }
