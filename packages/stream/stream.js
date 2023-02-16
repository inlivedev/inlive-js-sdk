import { initStream } from '../stream/init-stream/init-stream.js'
import { prepareStream } from '../stream/prepare-stream/prepare-stream.js'
import { startStream } from '../stream/start-stream/start-stream.js'
import { fetchStream } from '../stream/fetch-stream/fetch-stream.js'
import { Internal } from '../internal/index.js'
import { endStream } from './end-stream/end-stream.js'

const { webrtc } = Internal

/**
 * a stream object that will hold all stream states
 *
 * @module Stream
 */

/**
 * @typedef {import('../app/init/init.js').InitializationInstance} App
 */

/**
 * @typedef {import('./fetch-stream/fetch-stream.js').StreamResponse} StreamResponse
 */

/**
 * @typedef Manifests
 * @property {string} hls - hls master playlist
 * @property {string} dash - dash manifest
 */

/*  Class representing a Stream. */
export class Stream {
  static READY = 'streamReady'
  static STARTED = 'streamStarted'
  static ENDED = 'streamEnded'
  static ERROR = 'streamError'
  static ICECANDIDATE = 'iceCandidate'
  static STATECHANGED = 'stateChanged'

  static STATE_NEW = 'new'
  static STATE_CONNECTING = 'connecting'
  static STATE_CONNECTED = 'connected'
  static STATE_COMPLETED = 'completed'
  static STATE_DISCONNECTED = 'disconnected'
  static STATE_READY = 'ready'
  static STATE_LIVE = 'live'
  static STATE_FAILED = 'failed'
  static STATE_ENDED = 'ended'

  /**
   * Stream constructor.
   *
   * @param {App} app - The app instance with configurations.
   * @param {StreamResponse} streamResponse - The stream response from the stream API endpoint.
   */
  constructor(app, streamResponse) {
    /**
     * The app instance with configurations.
     *
     * @type {App}
     * @public
     */
    this.app = app

    /**
     * The stream ID.
     *
     * @type {number}
     * @public
     */
    this.id = streamResponse.id

    /**
     * The stream ID.
     *
     * @type {string}
     * @public
     */
    this.state = Stream.STATE_NEW

    /**
     * The stream name.
     *
     * @type {string}
     * @public
     */
    this.name = streamResponse.name

    /**
     * The stream data from the stream API endpoint.
     *
     * @public
     * @type {StreamResponse}
     */

    this.data = streamResponse

    /**
     * The video and audio tracks for live streaming.
     *
     * @type {MediaStream|null}
     * @public
     */
    this.mediaStream = null

    /**
     * The RTCPeerConnection object for WebRTC connection
     *
     * @type {RTCPeerConnection|null}
     * @public
     */
    this.peerConnection = null

    /**
     * The eventHandler map object streaming event
     *
     * @type {Object<string, Function[]>}
     * @public
     */
    this.eventHandlers = {
      streamStarted: [],
      streamEnded: [],
      streamError: [],
      iceCandidate: [],
      stateChanged: [],
    }

    /**
     * The eventHandler map object streaming event
     *
     * @type {Manifests}
     * @public
     */

    this.manifests = {
      dash: '',
      hls: '',
    }

    if (streamResponse.dashUrl !== '' && streamResponse.hlsUrl !== '') {
      this.manifests.dash = streamResponse.dashUrl
      this.manifests.hls = streamResponse.hlsUrl
    }

    /**
     * The pending ice candidates that can't be added because the remote SDP is not received yet
     *
     * @type {Array.<RTCIceCandidate>}
     * @private
     */
    this.pandingIceCandidates = []
  }

  /**
   * Get the base URL of API endpoint
   *
   * @returns {string} baseURL - return string of API base URL
   */
  getBaseUrl() {
    return `${this.app.config.api.baseUrl}/${this.app.config.api.version}`
  }

  /**
   * Subscribe to events
   */
  async subscribe() {
    let events = null
    if (
      typeof this.app.config.apiKey === 'undefined' ||
      this.app.config.apiKey === ''
    ) {
      events = new EventSource(
        `${this.getBaseUrl()}/streams/${this.id}/events`,
        {
          withCredentials: true,
        }
      )
    } else {
      const eventKey = await this.getEventKey()
      events = new EventSource(
        `${this.getBaseUrl()}/streams/${this.id}/events/${eventKey}`,
        {
          withCredentials: true,
        }
      )
    }

    this.setEventHandlers(events)
  }

  /**
   * Set event listeners and event dispatchers
   *
   * @param {EventSource} events - event source instance
   */
  async setEventHandlers(events) {
    events.addEventListener(Stream.STARTED, (event) => {
      this.dispatchEvent(Stream.STARTED, event.data)
    })

    events.addEventListener(Stream.ENDED, (event) => {
      this.dispatchEvent(Stream.ENDED, event.data)
    })

    events.addEventListener(Stream.ERROR, (event) => {
      this.dispatchEvent(Stream.ERROR, event.data)
    })

    events.addEventListener(Stream.ICECANDIDATE, (event) => {
      const iceCandidateJSON = JSON.parse(event.data)
      this.addIceCandidate(iceCandidateJSON)
    })
  }

  /**
   * Add ice candidate from remote peer connection
   *
   * @param {RTCIceCandidate} iceCandidate - ice candidate from remote peer connection
   */
  addIceCandidate(iceCandidate) {
    if (this.peerConnection === null) {
      throw new Error('the peer connection is not set')
    }

    const remoteIceCandidate = new RTCIceCandidate(iceCandidate)

    if (
      this.peerConnection.remoteDescription === null ||
      this.peerConnection.pendingRemoteDescription !== null
    ) {
      this.pandingIceCandidates.push(remoteIceCandidate)
      return
    }

    this.peerConnection.addIceCandidate(remoteIceCandidate)
  }

  /**
   * Dispatch event to added event handlers
   *
   * @param {string} eventName - Name of event to dispatch
   * @param {object }data - Data to pass into event handler
   */
  dispatchEvent(eventName, data) {
    if (!(eventName in this.eventHandlers)) {
      throw new Error(
        'Unknown event, available events are Stream.READY|Stream.STARTED|Stream.ENDED|Stream.ERROR|Stream.STATECHANGED'
      )
    }

    for (const handlerFunction of this.eventHandlers[eventName]) {
      handlerFunction(data)
    }
  }

  /**
   * @callback eventHandler
   * @param {object=} data - Data to pass into event handler
   */

  /**
   * Add event handler to specific event
   *
   * @param {string} eventName - Name of event to listen
   * @param {eventHandler} handlerFunction  - function to handle the event
   */
  on(eventName, handlerFunction) {
    if (typeof this.eventHandlers[eventName] === 'undefined') {
      this.eventHandlers[eventName] = []
    }

    this.eventHandlers[eventName].push(handlerFunction)
  }

  /**
   *
   * @param {string} newState - new state of the stream
   */
  changeState(newState) {
    this.state = newState
    this.dispatchEvent(Stream.STATECHANGED, { state: newState })
  }

  /**
   * Get the event key for events endpoint authentication
   *
   * @returns {Promise<string>} eventKey - JWT token for event endpoint authentication
   */
  async getEventKey() {
    const baseUrl = this.getBaseUrl()
    let token = ''

    let fetchResponse = await Internal.fetchHttp({
      url: `${baseUrl}/streams/${this.id}/eventkey`,
      token: this.app.config.apiKey,
      method: 'POST',
    }).catch((error) => {
      return error
    })

    if (fetchResponse) {
      switch (fetchResponse.code) {
        case 200:
          token = fetchResponse.data

          break
        case 404: {
          throw new Error(
            'Failed to get the event key because the stream ID is not found. Please provide a valid stream ID.'
          )
        }
        case 403: {
          throw new Error(
            'Failed to get event key because the authentication is failed. Check the API key'
          )
        }
        default:
          break
      }
    }

    return token
  }

  /**
   * listen to RTCPeerConnection event changes
   */
  listenForWebRTCEvent() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.peerConnection.addEventListener('icecandidate', (event_) => {
      if (event_.candidate) {
        if (event_.candidate.candidate === '') {
          return
        }
        const { candidate } = event_
        this.sendIceCandidate(candidate)
      }
    })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.peerConnection.addEventListener('iceconnectionstatechange', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      switch (this.peerConnection.iceConnectionState) {
        case 'new':
          this.changeState(Stream.STATE_CONNECTING)
          break
        case 'connected':
          this.changeState(Stream.STATE_CONNECTED)
          break
        case 'completed':
          this.changeState(Stream.STATE_COMPLETED)
          break
        case 'disconnected':
          this.changeState(Stream.STATE_DISCONNECTED)
          break
        case 'closed':
          this.changeState(Stream.STATE_ENDED)
          break
        case 'failed':
          this.changeState(Stream.STATE_FAILED)
          break
        default:
          break
      }
    })
  }

  /**
   * Adding pending ice candidates after set remote local description
   *
   * @private
   */

  /**
   *
   */
  addPendingIceCandidates() {
    for (const iceCandidate of this.pandingIceCandidates) {
      this.peerConnection?.addIceCandidate(iceCandidate)
    }
  }

  /**
   * Initiate the stream for live streaming
   *
   * @param {MediaStream} mediaStream - The video and audio stream tracks for going live
   * @returns {Promise<boolean>} Promise object represent true value if initialization is complete
   * @todo need to refactor because sometimes the ice event arrive before the answer is added. Maybe need to wait the answer first but make sure we're not lost all the ice candidates.
   */
  async init(mediaStream) {
    if (this.state === Stream.STATE_NEW) {
      // the prepare method is not called
      await this.prepare()
    }

    this.mediaStream = mediaStream
    this.peerConnection = webrtc.openConnection()

    this.listenForWebRTCEvent()

    for (const track of mediaStream.getTracks()) {
      this.peerConnection.addTrack(track, mediaStream)
    }
    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)

    const waitConnected = new Promise((resolve, reject) => {
      this.on(Stream.STATECHANGED, (event_) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (
          event_.state === Stream.STATE_CONNECTED ||
          event_.state === Stream.STATE_COMPLETED
        ) {
          resolve(true)
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
        } else if (event_.state === Stream.STATE_FAILED) {
          reject(false)
        }
      })

      this.on(Stream.ERROR, () => reject(false))
    })

    const parameters = {
      streamId: this.id,
      sessionDescription: this.peerConnection.localDescription,
    }

    const resp = await initStream(this.app, parameters)

    this.peerConnection.setRemoteDescription(resp.data)

    this.addPendingIceCandidates()

    return waitConnected
  }

  /**
   *
   * @param {RTCIceCandidate} iceCandidate - ice candidate to send to remote RTCPeerConnection
   */
  async sendIceCandidate(iceCandidate) {
    const baseUrl = this.getBaseUrl()
    let fetchResponse = await Internal.fetchHttp({
      url: `${baseUrl}/streams/${this.id}/ice`,
      body: iceCandidate.toJSON(),
      token: this.app.config.apiKey,
      method: 'POST',
    })

    if (fetchResponse) {
      switch (fetchResponse.code) {
        case 404: {
          throw new Error(
            'the stream ID is not found. Please provide a valid stream ID.'
          )
        }
        case 400: {
          throw new Error('Bad request, invalid ice candidate')
        }
        default:
          break
      }
    }
  }

  /**
   * Subscribe to events and prepare the stream server for going live.
   */
  async prepare() {
    await this.subscribe()
    await prepareStream(this.app, this.id)
    this.changeState(Stream.STATE_READY)
  }

  /**
   * Start the live streaming
   */
  async live() {
    if (
      this.state !== Stream.STATE_CONNECTED &&
      this.state !== Stream.STATE_COMPLETED
    ) {
      throw new Error(
        'The live function is called before the state change to connected/completed. Use stream.on(Stream.STATECHANGED,(ev) => if(ev.state ===Stream.STATE_COMPLETED || ev.state ===Stream.STATE_CONNECTED){...}) to know when the connection is ready for live.'
      )
    }

    this.manifests = await startStream(this.app, this.id)
    this.data = await fetchStream(this.app, this.id)
    this.changeState(Stream.STATE_LIVE)
  }

  /**
   * End the live streaming
   */
  async end() {
    await endStream(this.app, this.id)
    if (this.peerConnection) this.peerConnection.close()
    this.data = await fetchStream(this.app, this.id)
    this.changeState(Stream.STATE_ENDED)
  }
}
