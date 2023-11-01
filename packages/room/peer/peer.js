import {
  getBrowserName,
  CHROME,
  EDGE,
  OPERA,
  SAFARI,
} from '../../internal/utils/get-browser-name.js'
import { VideoObserver } from '../observer/video-observer.js'
import { BandwidthController } from '../bandwidth-controller/bandwidth-controller.js'

/** @type {import('./peer-types.js').RoomPeerType.PeerEvents} */
export const PeerEvents = {
  PEER_OPENED: 'peerOpened',
  PEER_CLOSED: 'peerClosed',
  STREAM_AVAILABLE: 'streamAvailable',
  STREAM_REMOVED: 'streamRemoved',
  _STREAM_ADDED: 'streamAdded',
  _INTERNAL_DATACHANNEL_AVAILABLE: 'internalDataChannelAvailable',
}

const MAX_BITRATE = 1500 * 1000
const MID_BITRATE = 500 * 1000
const MIN_BITRATE = 150 * 1000

/** @param {import('./peer-types.js').RoomPeerType.PeerDependencies} peerDependencies Dependencies for peer module */
export const createPeer = ({ api, createStream, event, streams, config }) => {
  const Peer = class {
    _roomId = ''
    _clientId = ''
    _api
    _event
    _streams
    _stream
    /** @type {RTCPeerConnection | null} */
    _peerConnection = null
    _bwController
    /** @type {VideoObserver | null} */
    _videoObserver
    /** @type {Array<HTMLVideoElement>} */
    _pendingObservedVideo

    constructor() {
      this._api = api
      this._event = event
      this._streams = streams
      this._stream = createStream()

      this._bwController = new BandwidthController({
        peer: this,
        event: this._event,
      })

      this._videoObserver = null
      this._pendingObservedVideo = []
    }

    /**
     * Initiate a peer connection
     * @param {string} roomId
     * @param {string} clientId
     */
    connect = async (roomId, clientId) => {
      if (this._peerConnection) return

      this._roomId = roomId
      this._clientId = clientId

      this._peerConnection = new RTCPeerConnection({
        iceServers: config.webrtc.iceServers,
      })

      this._addEventListener()
      this._event.emit(PeerEvents.PEER_OPENED, {
        roomId: this._roomId,
        clientId: this._clientId,
      })
    }

    disconnect = () => {
      if (!this._peerConnection) return

      for (const transceiver of this._peerConnection.getTransceivers()) {
        if (transceiver.sender.track) {
          transceiver.sender.track.stop()
          this._peerConnection.removeTrack(transceiver.sender)
        }

        transceiver.stop()
      }

      this._removeEventListener()
      this._peerConnection.close()
      this._peerConnection = null
      this._roomId = ''
      this._clientId = ''
      this._event.emit(PeerEvents.PEER_CLOSED)
    }

    getClientId = () => {
      return this._clientId
    }

    getRoomId = () => {
      return this._roomId
    }

    getPeerConnection = () => {
      return Object.freeze(this._peerConnection)
    }

    /**
     * Add a new stream
     * @param {string} key
     * @param {import('../stream/stream-types.js').RoomStreamType.AddStreamParameters} data
     */
    addStream = (key, data) => {
      this._streams.validateKey(key)
      this._streams.validateStream(data)
      this._event.emit(PeerEvents._STREAM_ADDED, { key, data })
    }

    /**
     * Remove a stream
     * @param {string} key
     * @returns {import('../stream/stream-types.js').RoomStreamType.InstanceStream | null} Returns the deleted stream data for the last time
     */
    removeStream = (key) => {
      this._streams.validateKey(key)
      const removedStream = this._streams.removeStream(key)

      if (removedStream) {
        this._event.emit(PeerEvents.STREAM_REMOVED, { stream: removedStream })
      }

      return removedStream
    }

    /**
     * Get all stored streams
     */
    getAllStreams = () => {
      return this._streams.getAllStreams()
    }

    /**
     * Get a specific stream
     * @param {string} key
     * @returns {import('../stream/stream-types.js').RoomStreamType.InstanceStream | null} Returns the stream data if the data exists
     */
    getStream = (key) => {
      this._streams.validateKey(key)
      return this._streams.getStream(key)
    }

    /**
     * Get a specific stream by track ID
     * @param {string} trackId
     * @returns {import('../stream/stream-types.js').RoomStreamType.InstanceStream | null} Returns the stream data if the data exists
     */
    getStreamByTrackId = (trackId) => {
      return this._streams.getStreamByTrackId(trackId)
    }

    /**
     * Get a total number of stored streams
     * @returns {number}
     */
    getTotalStreams = () => {
      return this._streams.getTotalStreams()
    }

    /**
     * Check if a specific stream has already stored
     * @param {string} key
     * @returns {boolean}
     */
    hasStream = (key) => {
      this._streams.validateKey(key)
      return this._streams.hasStream(key)
    }

    /**
     * Turn on the local camera
     */
    turnOnCamera = () => {
      if (!this._peerConnection) return
      this._setTrackEnabled(this._peerConnection, 'video', true)
    }

    /**
     * Turn on the local microphone
     */
    turnOnMic = () => {
      if (!this._peerConnection) return
      this._setTrackEnabled(this._peerConnection, 'audio', true)
    }

    /**
     * Turn off the local camera
     */
    turnOffCamera = () => {
      if (!this._peerConnection) return
      this._setTrackEnabled(this._peerConnection, 'video', false)
    }

    /**
     * Turn off the local microphone
     */
    turnOffMic = () => {
      if (!this._peerConnection) return
      this._setTrackEnabled(this._peerConnection, 'audio', false)
    }

    /**
     * @param {MediaStreamTrack} newTrack
     */
    replaceTrack = async (newTrack) => {
      if (!this._peerConnection) return

      if (!(newTrack instanceof MediaStreamTrack)) {
        throw new TypeError('The track must be an instance of MediaStreamTrack')
      }

      for (const transceiver of this._peerConnection.getTransceivers()) {
        if (
          transceiver.sender.track &&
          transceiver.sender.track.kind === newTrack.kind
        ) {
          await transceiver.sender.replaceTrack(newTrack)
        }
      }
    }

    /**
     * @param {HTMLVideoElement} videoElement
     */
    observeVideo = (videoElement) => {
      if (!this._videoObserver) {
        this._pendingObservedVideo.push(videoElement)
        return
      }

      this._videoObserver.observe(videoElement)
    }

    /**
     * @param {HTMLVideoElement} videoElement
     */
    unobserveVideo = (videoElement) => {
      if (!this._videoObserver) {
        return
      }

      this._videoObserver.unobserve(videoElement)
    }

    _addEventListener = () => {
      if (!this._peerConnection) return

      this._peerConnection.addEventListener(
        'iceconnectionstatechange',
        this._onIceConnectionStateChange
      )

      this._peerConnection.addEventListener(
        'negotiationneeded',
        this._onNegotiationNeeded
      )

      this._peerConnection.addEventListener(
        'icecandidate',
        this._onIceCandidate
      )

      this._peerConnection.addEventListener('track', this._onTrack)

      this._peerConnection.addEventListener('datachannel', this._onDataChannel)

      window.addEventListener('beforeunload', this._onBeforeUnload)

      this._event.on(PeerEvents._STREAM_ADDED, this._onStreamAdded)
    }

    _removeEventListener = () => {
      if (!this._peerConnection) return

      this._peerConnection.removeEventListener(
        'iceconnectionstatechange',
        this._onIceConnectionStateChange
      )

      this._peerConnection.removeEventListener(
        'negotiationneeded',
        this._onNegotiationNeeded
      )

      this._peerConnection.removeEventListener(
        'icecandidate',
        this._onIceCandidate
      )

      this._peerConnection.removeEventListener('track', this._onTrack)

      this._peerConnection.removeEventListener(
        'datachannel',
        this._onDataChannel
      )

      window.removeEventListener('beforeunload', this._onBeforeUnload)
    }

    /**
     * @param {RTCPeerConnection} peerConnection
     * @param {'video' | 'audio'} kind
     * @param {boolean} enabled
     */
    _setTrackEnabled = (peerConnection, kind, enabled) => {
      const stream = this._streams.getAllStreams().find((stream) => {
        return stream.origin === 'local' && stream.source === 'media'
      })

      if (!stream) {
        throw new Error(
          'You must add a user MediaStream in order to proceed this operation'
        )
      }

      const mediaTrack = stream.mediaStream.getTracks().find((track) => {
        return track.kind === kind
      })

      if (!mediaTrack) return

      for (const sender of peerConnection.getSenders()) {
        if (!sender.track) return

        if (
          sender.track.kind === mediaTrack.kind &&
          sender.track.id === mediaTrack.id
        ) {
          sender.track.enabled = enabled
        }
      }
    }

    _restartNegotiation = async () => {
      if (!this._peerConnection) return

      const allowNegotiateResponse = await this._api.checkNegotiateAllowed(
        this._roomId,
        this._clientId
      )

      if (!allowNegotiateResponse.ok) return

      try {
        const offer = await this._peerConnection.createOffer({
          iceRestart: true,
        })

        await this._peerConnection.setLocalDescription(offer)

        if (!this._peerConnection.localDescription) {
          throw new Error(
            'Failed to set the local description on restart negotiation'
          )
        }

        await this._api.negotiateConnection(
          this._roomId,
          this._clientId,
          this._peerConnection.localDescription
        )
      } catch (error) {
        console.error(error)
      }
    }

    /**
     * @param {RTCRtpCodecCapability[]} codecsList
     * @param {string} codec
     * @returns {RTCRtpCodecCapability[]}
     */
    _addCodec = (codecsList, codec) => {
      const codecCapabilities = RTCRtpReceiver.getCapabilities('video')?.codecs

      if (codecCapabilities) {
        for (const codecCapability of codecCapabilities) {
          if (codecCapability.mimeType === codec) {
            codecsList.push(codecCapability)
          }
        }
      }

      return codecsList
    }

    /**
     * @param {import('../stream/stream-types.js').RoomStreamType.InstanceStream} stream
     */
    _addLocalMediaStream = (stream) => {
      if (!this._peerConnection) return

      /** @type {MediaStreamTrack | undefined} */
      const audioTrack = stream.mediaStream.getAudioTracks()[0]

      /** @type {MediaStreamTrack | undefined} */
      const videoTrack = stream.mediaStream.getVideoTracks()[0]

      if (audioTrack) {
        this._peerConnection.addTransceiver(audioTrack, {
          direction: 'sendonly',
          streams: [stream.mediaStream],
          sendEncodings: [{ priority: 'high' }],
        })
      }

      const browserName = getBrowserName()
      const simulcastBrowsers = [SAFARI, CHROME, EDGE, OPERA]

      let svc = true

      /** @type {RTCRtpCodecCapability[]} */
      let codecList = []

      codecList = this._addCodec(codecList, 'video/VP9')

      if (codecList.length === 0) {
        svc = false
        codecList = this._addCodec(codecList, 'video/H264')
      }

      /** @type {import('../peer/peer-types.js').RoomPeerType.RTCRtpSVCTransceiverInit} */
      const scaleableInit = {
        direction: 'sendonly',
        streams: [stream.mediaStream],
        sendEncodings: [
          {
            maxBitrate: MAX_BITRATE,
            scalabilityMode: 'L3T2',
          },
        ],
      }

      /** @type {RTCRtpTransceiverInit} */
      const simulcastInit = {
        direction: 'sendonly',
        streams: [stream.mediaStream],
      }

      if (browserName !== null && simulcastBrowsers.includes(browserName)) {
        simulcastInit['sendEncodings'] = [
          // for firefox order matters... first high resolution, then scaled resolutions...
          {
            rid: 'high',
            maxBitrate: MAX_BITRATE,
            maxFramerate: 30,
          },
          {
            rid: 'mid',
            // eslint-disable-next-line unicorn/no-zero-fractions
            scaleResolutionDownBy: 2.0,
            maxFramerate: 30,
            maxBitrate: MID_BITRATE,
          },
          {
            rid: 'low',
            // eslint-disable-next-line unicorn/no-zero-fractions
            scaleResolutionDownBy: 4.0,
            maxBitrate: MIN_BITRATE,
            maxFramerate: 30,
          },
        ]
      }

      const tcvr = svc
        ? this._peerConnection.addTransceiver(videoTrack, scaleableInit)
        : this._peerConnection.addTransceiver(videoTrack, simulcastInit)

      if (tcvr.setCodecPreferences !== undefined) {
        tcvr.setCodecPreferences(codecList)
      }
    }

    /**
     * @param {import('../stream/stream-types.js').RoomStreamType.InstanceStream} stream
     */
    _addLocalScreenStream = (stream) => {
      if (!this._peerConnection) return

      for (const track of stream.mediaStream.getTracks()) {
        const transceiver = this._peerConnection.addTransceiver(track, {
          direction: 'sendonly',
          streams: [stream.mediaStream],
        })

        track.addEventListener('ended', () => {
          if (!this._peerConnection || !transceiver.sender) return
          this._peerConnection.removeTrack(transceiver.sender)
          this.removeStream(stream.id)
        })
      }
    }

    _onIceConnectionStateChange = async () => {
      if (!this._peerConnection) return

      const { iceConnectionState } = this._peerConnection

      console.log('ice connection state changed to', iceConnectionState)

      if (iceConnectionState === 'failed') {
        await this._restartNegotiation()
      }
    }

    _onNegotiationNeeded = async () => {
      if (!this._roomId || !this._clientId) return

      const allowNegotiateResponse = await this._api.checkNegotiateAllowed(
        this._roomId,
        this._clientId
      )

      if (!allowNegotiateResponse.ok || !this._peerConnection) return

      try {
        const offer = await this._peerConnection.createOffer()
        await this._peerConnection.setLocalDescription(offer)

        if (!this._peerConnection.localDescription) {
          throw new Error(
            'Failed to set the local description on negotiationneeded'
          )
        }

        const negotiateResponse = await this._api.negotiateConnection(
          this._roomId,
          this._clientId,
          this._peerConnection.localDescription
        )

        if (!negotiateResponse.ok || !negotiateResponse.data) {
          throw new Error('Failed to get a negotiate response')
        }

        const { answer } = negotiateResponse.data
        const sdpAnswer = new RTCSessionDescription(answer)
        await this._peerConnection.setRemoteDescription(sdpAnswer)
      } catch (error) {
        console.error(error)
      }
    }

    /**
     * @param {RTCPeerConnectionIceEvent} event
     */
    _onIceCandidate = async (event) => {
      if (!this._roomId || !this._clientId) return

      const { candidate } = event

      if (candidate) {
        await this._api.sendIceCandidate(
          this._roomId,
          this._clientId,
          candidate
        )
      }
    }

    /**
     * @param {RTCTrackEvent} event
     */
    _onTrack = async (event) => {
      const mediaStream = event.streams.find((stream) => stream.active === true)

      if (!(mediaStream instanceof MediaStream)) return
      if (this.hasStream(mediaStream.id)) return

      mediaStream.addEventListener('removetrack', (event) => {
        const target = event.target

        if (!(target instanceof MediaStream)) return

        if (this.hasStream(target.id) && target.getTracks().length === 0) {
          this.removeStream(target.id)
        }
      })

      const draftStream = this._streams.getDraft(mediaStream.id) || {}

      this.addStream(mediaStream.id, {
        clientId: draftStream.clientId || '',
        name: draftStream.name || '',
        origin: draftStream.origin || 'remote',
        source: draftStream.source || 'media',
        mediaStream: mediaStream,
      })

      this._streams.removeDraft(mediaStream.id)
    }

    /**
     * @param {RTCDataChannelEvent} event
     */
    _onDataChannel = (event) => {
      if (event.channel.label === 'internal') {
        const internalChannel = event.channel
        this._event.emit(
          PeerEvents._INTERNAL_DATACHANNEL_AVAILABLE,
          internalChannel
        )

        this._videoObserver = new VideoObserver(internalChannel, 1000)

        for (const videoElement of this._pendingObservedVideo) {
          this._videoObserver.observe(videoElement)
        }
      }
    }

    _onBeforeUnload = async () => {
      if (!this._roomId || !this._clientId) return

      this._api.leaveRoom(this._roomId, this._clientId, true)
      this.disconnect()
    }

    /** @param {{ key: string, data: import('../stream/stream-types.js').RoomStreamType.AddStreamParameters }} data */
    _onStreamAdded = ({ key, data }) => {
      const stream = this._stream.createInstance({
        id: key,
        ...data,
      })

      this._streams.addStream(key, stream)

      if (stream.origin === 'local' && stream.source === 'media') {
        this._addLocalMediaStream(stream)
      }

      if (stream.origin === 'local' && stream.source === 'screen') {
        this._addLocalScreenStream(stream)
      }

      this._event.emit(PeerEvents.STREAM_AVAILABLE, { stream })
    }
  }

  return {
    createInstance: () => {
      const peer = new Peer()

      return {
        connect: peer.connect,
        disconnect: peer.disconnect,
        getClientId: peer.getClientId,
        getRoomId: peer.getRoomId,
        getPeerConnection: peer.getPeerConnection,
        addStream: peer.addStream,
        removeStream: peer.removeStream,
        getAllStreams: peer.getAllStreams,
        getStream: peer.getStream,
        getStreamByTrackId: peer.getStreamByTrackId,
        getTotalStreams: peer.getTotalStreams,
        hasStream: peer.hasStream,
        turnOnCamera: peer.turnOnCamera,
        turnOnMic: peer.turnOnMic,
        turnOffCamera: peer.turnOffCamera,
        turnOffMic: peer.turnOffMic,
        replaceTrack: peer.replaceTrack,
        observeVideo: peer.observeVideo,
        unobserveVideo: peer.unobserveVideo,
      }
    },
  }
}
