import { InitializationInstance } from '../../app/init/init.js'
import { Internal } from '../../internal/index.js'
import { getStream } from '../get-stream/get-stream.js'
import { event } from '../../event/event.js'

/**
 * @typedef Config
 * @property {number} stream_id - The ID of the stream
 * @property {import('../../internal/webrtc/webrtc').MediaObject} media - The media object argument to set the media for the stream
 */

/**
 * @typedef ICEConnectionStateChangeEvent
 * @property {string} type - The type of the event
 * @property {object} detail - The detail data sent through event
 * @property {string} detail.iceConnectionState - The current ice connection state
 */

/**
 * @typedef WebSocketEvent
 * @property {string} type - The type of the event
 * @property {string} event_name - The name of the event
 */

/**
 * Prepare a stream server
 *
 * @param {object} initInstance - The initialization instance received from the init() function
 * @param {Config} config - Key / value configuration
 */
const prepareStream = async (initInstance, config) => {
  /**
   * ======================================================
   *  Validations
   * ======================================================
   */

  if (!(initInstance instanceof InitializationInstance)) {
    throw new TypeError(
      `Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function`
    )
  } else if (!config || config.stream_id === undefined) {
    throw new Error(
      'Failed to process because the stream ID is not provided. Please provide the stream ID!'
    )
  } else if (typeof config.stream_id !== 'number') {
    throw new TypeError(
      'Failed to process because the stream ID is not in a number format. The stream ID must be in a number format'
    )
  } else if (!config.media || !config.media.videoSelector) {
    throw new Error(
      'Failed to process because the video element for live streaming is not set. You need to have a video element which will display the camera. Please set the video element by setting it through the videoSelector argument'
    )
  } else if (
    config.media.videoSelector &&
    typeof config.media.videoSelector !== 'string'
  ) {
    throw new TypeError(
      'Failed to process because the video selector is not in a string format. Please provide a valid CSS selector in a string format'
    )
  }

  /**
   * ======================================================
   *  Variables
   * ======================================================
   */

  const {
    config: { api_key },
  } = initInstance

  const { channel, config: appConfig, fetchHttp, webrtc } = Internal

  const { stream_id, media } = config

  const apiBaseUrl = `${appConfig.api.base_url}/${appConfig.api.version}`

  let isPodReady = false

  /**
   * ======================================================
   *  Functions
   * ======================================================
   */

  /**
   * Handle prepare a stream
   *
   * @returns {Promise<any>} Returns a promise
   */
  const handlePrepareStream = async () => {
    try {
      fetchHttp({
        url: `${apiBaseUrl}/streams/${stream_id}/prepare`,
        token: api_key,
        method: 'POST',
        body: {},
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  /**
   * Handle init a stream
   *
   * @param {RTCPeerConnection} peerConnection - The RTCPeerConnection object that represents a WebRTC connection
   */
  const handleInitStream = async (peerConnection) => {
    const body = {
      session_description: peerConnection.localDescription,
    }

    try {
      const response = await fetchHttp({
        url: `${apiBaseUrl}/streams/${stream_id}/init`,
        token: api_key,
        method: 'POST',
        body,
      })
      webrtc.setRemoteOffer(response.data)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  /**
   * Handle a connection to the channel
   */
  const openChannelConnection = () => {
    channel.subscribe(stream_id)
    channel.onMessage(
      /** @param {WebSocketEvent} data - Data received from the channel */
      async (data) => {
        const peerConnection = webrtc.getConnection()
        const clientState = webrtc.getClientState()

        if (data.type === 'pod' && data.event_name === 'ready') {
          if (!isPodReady && peerConnection) {
            isPodReady = true
            handleInitStream(peerConnection)
          }
        } else if (
          data.type === 'pod' &&
          data.event_name === 'killed' &&
          clientState !== 'live' &&
          clientState !== 'end'
        ) {
          isPodReady = false
          handlePrepareStream()
        } else if (data.type === 'stream' && data.event_name === 'start') {
          webrtc.setClientState('live')
          event.publish('stream:start-event', {
            type: 'stream:start-event',
            detail: {
              start: true,
              message: 'The stream has started',
            },
          })
        } else if (data.type === 'stream' && data.event_name === 'end') {
          webrtc.setClientState('end')
          webrtc.closeConnection()
          event.publish('stream:end-event', {
            type: 'stream:end-event',
            detail: {
              end: true,
              message: 'The stream has ended',
            },
          })
        }
      }
    )
  }

  /**
   * Function to handle the ice connection state change event
   */
  const observeConnectionStateChange = () => {
    event.subscribe(
      'stream:ice-connection-state-change-event',
      /** @param {ICEConnectionStateChangeEvent} data - The object data sent by the publisher method */
      async (data) => {
        const { detail } = data

        const clientState = webrtc.getClientState()

        if (detail && detail.iceConnectionState) {
          const { iceConnectionState } = detail

          if (iceConnectionState === 'failed' && clientState !== 'end') {
            /**
             * Restart the peer connection for failed ice connection state
             */
            webrtc.setClientState('connecting')
            webrtc.closeConnection()

            const peerConnection = await webrtc.openConnection()
            handleInitStream(peerConnection)
          } else if (iceConnectionState === 'connected') {
            /**
             * Check the status of the stream every time ice connection state changes to connected
             */
            const { data } = await getStream(stream_id)
            const latestStreamData = data || {}

            if (latestStreamData.start_time && latestStreamData.end_time) {
              webrtc.setClientState('end')
              webrtc.closeConnection()
              event.publish('stream:end-event', {
                type: 'stream:end-event',
                detail: {
                  end: true,
                  message: 'The stream has ended',
                },
              })
            } else if (
              latestStreamData.start_time &&
              !latestStreamData.end_time
            ) {
              webrtc.setClientState('live')
              event.publish('stream:start-event', {
                type: 'stream:start-event',
                detail: {
                  start: true,
                  message: 'The stream has started',
                },
              })
            } else if (
              !latestStreamData.start_time &&
              !latestStreamData.end_time
            ) {
              webrtc.setClientState('ready')
              event.publish('stream:ready-to-start-event', {
                type: 'stream:ready-to-start-event',
                detail: {
                  ready: true,
                  message: 'Ready to start a live streaming',
                },
              })
            }
          }
        }
      }
    )
  }

  /**
   * ======================================================
   *  Executions
   * ======================================================
   */

  /**
   * Get the peer connection
   */
  const latestStreamData = await getStream(stream_id)

  if (latestStreamData.data.end_time) {
    webrtc.setClientState('end')
    webrtc.closeConnection()
    throw new Error(
      'Failed to process because the stream with the specific ID has already ended. You can create a new stream to start streaming.'
    )
  }

  openChannelConnection()
  observeConnectionStateChange()

  let peerConnection

  try {
    await webrtc.setMediaStream(media)
    peerConnection = await webrtc.openConnection()
  } catch (error) {
    console.error(error)
    throw error
  }

  if (!latestStreamData.data.prepared_at) {
    handlePrepareStream()
  } else if (
    latestStreamData.data.prepared_at &&
    !isPodReady &&
    peerConnection
  ) {
    isPodReady = true
    handleInitStream(peerConnection)
  }
}

export { prepareStream }
