import {
  getBrowserName,
  FIREFOX,
} from '../../internal/utils/get-browser-name.js'
import { VideoObserver } from '../observer/video-observer.js'
import { BandwidthController } from '../bandwidth-controller/bandwidth-controller.js'
import { RoomEvent } from '../index.js'

export const InternalPeerEvents = {
  INTERNAL_DATACHANNEL_AVAILABLE: 'internalDataChannelAvailable',
}

/** @param {import('./peer-types.js').RoomPeerType.PeerDependencies} peerDependencies Dependencies for peer module */
export const createPeer = ({ api, createStream, event, streams, config }) => {
  const Peer = class extends EventTarget {
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
    /** @type {number} */
    _highBitrate
    /** @type {number} */
    _midBitrate
    /** @type {number} */
    _lowBitrate
    /** @type {Array<HTMLVideoElement>} */
    _pendingObservedVideo
    /** @type {Array<RTCIceCandidate>} */
    _pendingIceCandidates
    /** @type {boolean} */
    pendingNegotiation

    constructor() {
      super()
      this._api = api
      this._event = event
      this._streams = streams
      this._stream = createStream()

      this._bwController = new BandwidthController({
        peer: this,
        event: this._event,
      })

      this._videoObserver = null
      this._highBitrate = 1200 * 1000
      this._midBitrate = 500 * 1000
      this._lowBitrate = 150 * 1000
      this._pendingObservedVideo = []
      this._pendingIceCandidates = []
      /**
       * @type {{
       * webcam: RTCRtpCodecCapability[],
       * screen: RTCRtpCodecCapability[],
       * audio: RTCRtpCodecCapability[]
        }} */
      this._pendingPreferredCodecs = {
        webcam: [],
        screen: [],
        audio: [],
      }
      this.pendingNegotiation = false
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
      this._event.emit(RoomEvent.PEER_OPENED, {
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
      this._event.emit(RoomEvent.PEER_CLOSED)
    }

    getClientId = () => {
      return this._clientId
    }

    getRoom() {
      return this._api.getRoom(this._roomId)
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

      const stream = this._stream.createInstance({
        id: key,
        ...data,
      })

      this._streams.addStream(key, stream)

      if (stream.origin === 'local') {
        this._addLocalMediaStream(stream)
      }

      this._event.emit(RoomEvent.STREAM_AVAILABLE, { stream })
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
        this._event.emit(RoomEvent.STREAM_REMOVED, { stream: removedStream })
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
          await this.negotiate()
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
        'icecandidate',
        this._onIceCandidate
      )

      this._peerConnection.addEventListener('track', this._onTrack)

      this._peerConnection.addEventListener('datachannel', this._onDataChannel)

      this._event.on(
        RoomEvent.STREAM_AVAILABLE,
        /** @param {{ stream: import('../stream/stream-types.js').RoomStreamType.InstanceStream }} data  */
        async ({ stream }) => {
          if (stream.origin === 'local') {
            await this.negotiate()
          }
        }
      )

      this._event.on(
        RoomEvent.STREAM_REMOVED,
        /** @param {{ stream: import('../stream/stream-types.js').RoomStreamType.InstanceStream }} data  */
        async ({ stream }) => {
          if (stream.origin === 'local') {
            await this.negotiate()
          }
        }
      )

      window.addEventListener('beforeunload', this._onBeforeUnload)
    }

    _removeEventListener = () => {
      if (!this._peerConnection) return

      this._peerConnection.removeEventListener(
        'iceconnectionstatechange',
        this._onIceConnectionStateChange
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

      const transceivers = peerConnection.getTransceivers()

      for (const transceiver of transceivers) {
        const track = transceiver.sender.track
        if (!track) return

        if (track.kind === mediaTrack.kind && track.id === mediaTrack.id) {
          track.enabled = enabled
        }
      }
    }

    _restartNegotiation = async () => {
      if (!this._peerConnection) return

      const allowNegotiateResponse = await this._api.checkNegotiateAllowed(
        this._roomId,
        this._clientId
      )

      if (!allowNegotiateResponse.ok) {
        this.pendingNegotiation = true
        return
      }

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
     * @param {import('../stream/stream-types.js').RoomStreamType.InstanceStream} stream
     */
    _addLocalMediaStream = (stream) => {
      if (!this._peerConnection) return

      const supportsSetCodecPreferences =
        window.RTCRtpTransceiver &&
        'setCodecPreferences' in window.RTCRtpTransceiver.prototype

      /** @type {MediaStreamTrack | undefined} */
      const audioTrack = stream.mediaStream.getAudioTracks()[0]

      if (audioTrack) {
        const audioTransceiver = this._peerConnection.addTransceiver(
          audioTrack,
          {
            direction: 'sendonly',
            streams: [stream.mediaStream],
            sendEncodings: [{ priority: 'high' }],
          }
        )

        const systemAudioCodecs =
          RTCRtpSender.getCapabilities('audio')?.codecs || []
        const preferredAudioCodecs = []

        if (stream.source === 'media' && systemAudioCodecs.length > 0) {
          if (config.media.microphone.audioCodecs.length > 0) {
            for (const audioCodec of config.media.microphone.audioCodecs) {
              for (const systemAudioCodec of systemAudioCodecs) {
                if (
                  systemAudioCodec.mimeType.toLowerCase() ===
                  audioCodec.toLowerCase()
                ) {
                  preferredAudioCodecs.push(systemAudioCodec)
                  systemAudioCodecs.splice(
                    systemAudioCodecs.indexOf(systemAudioCodec),
                    1
                  )
                }
              }
            }
          } else {
            for (const systemAudioCodec of systemAudioCodecs) {
              if (systemAudioCodec.mimeType === 'audio/red') {
                preferredAudioCodecs.push(systemAudioCodec)
                systemAudioCodecs.splice(
                  systemAudioCodecs.indexOf(systemAudioCodec),
                  1
                )
              }
            }
            for (const systemAudioCodec of systemAudioCodecs) {
              if (systemAudioCodec.mimeType === 'audio/opus') {
                preferredAudioCodecs.push(systemAudioCodec)
                systemAudioCodecs.splice(
                  systemAudioCodecs.indexOf(systemAudioCodec),
                  1
                )
              }
            }
          }
        }

        // Add all remaining codecs
        for (const audioCodec of systemAudioCodecs) {
          preferredAudioCodecs.push(audioCodec)
        }

        if (supportsSetCodecPreferences) {
          audioTransceiver.setCodecPreferences(preferredAudioCodecs)
        } else {
          // TODO: Set codec preferences by modifying the SDP
          for (const audioCodec of preferredAudioCodecs) {
            this._pendingPreferredCodecs.audio.push(audioCodec)
          }
        }

        audioTrack.addEventListener('ended', () => {
          if (!this._peerConnection || !audioTransceiver.sender) return
          this._peerConnection.removeTrack(audioTransceiver.sender)
          this.removeStream(stream.id)
        })
      }

      if (stream.source === 'media') {
        this._addVideoTransceiver(stream, config, 'webcam')
      } else if (stream.source === 'screen') {
        this._addVideoTransceiver(stream, config, 'screen')
      }
    }

    /**
     * @param {import('../stream/stream-types.js').RoomStreamType.InstanceStream} stream
     * @param {import('../room-types.js').RoomType.Config} config
     * @param {'webcam' | 'screen'} type
     */
    _addVideoTransceiver = (stream, config, type) => {
      if (!this._peerConnection) return

      const supportsSetCodecPreferences =
        window.RTCRtpTransceiver &&
        'setCodecPreferences' in window.RTCRtpTransceiver.prototype
      const browserName = getBrowserName() || ''
      /** @type {MediaStreamTrack | undefined} */
      const videoTrack = stream.mediaStream.getVideoTracks()[0]
      /** @type {RTCRtpCodecCapability[]} */
      const preferredCodecs = []

      if (videoTrack) {
        const systemVideoCodecs =
          RTCRtpSender.getCapabilities('video')?.codecs || []

        for (const videoCodec of config.media[type].videoCodecs) {
          for (const systemVideoCodec of systemVideoCodecs) {
            if (
              systemVideoCodec.mimeType.toLowerCase() ===
              videoCodec.toLowerCase()
            ) {
              preferredCodecs.push(systemVideoCodec)
              systemVideoCodecs.splice(
                systemVideoCodecs.indexOf(systemVideoCodec),
                1
              )
            }
          }
        }

        // Add all remaining codecs
        for (const videoCodec of systemVideoCodecs) {
          preferredCodecs.push(videoCodec)
        }

        /** @type {RTCRtpTransceiverInit} */
        const transceiverInit = {
          direction: 'sendonly',
          streams: [stream.mediaStream],
        }

        const svcEnabled =
          config.media[type].svc &&
          config.media[type].scalabilityMode &&
          config.media[type].simulcast &&
          config.media[type].maxFramerate &&
          browserName !== FIREFOX

        const simulcastEnabled =
          config.media[type].simulcast && config.media[type].maxFramerate

        if (svcEnabled) {
          /** @type {import('../peer/peer-types.js').RoomPeerType.RTCRtpSVCEncodingParameters} */
          const scalableEncoding = {
            maxBitrate: this._highBitrate,
            scalabilityMode: config.media[type].scalabilityMode,
            maxFramerate: config.media[type].maxFramerate,
          }
          transceiverInit.sendEncodings = [scalableEncoding]
        } else if (simulcastEnabled) {
          /** @type {RTCRtpEncodingParameters[]} */
          const simulcastEncoding = [
            // for firefox order matters... first high resolution, then scaled resolutions...
            {
              rid: 'high',
              maxFramerate: config.media[type].maxFramerate,
              maxBitrate: this._highBitrate,
            },
            {
              rid: 'mid',
              // eslint-disable-next-line unicorn/no-zero-fractions
              scaleResolutionDownBy: 2.0,
              maxFramerate: config.media[type].maxFramerate,
              maxBitrate: this._midBitrate,
            },
            {
              rid: 'low',
              // eslint-disable-next-line unicorn/no-zero-fractions
              scaleResolutionDownBy: 4.0,
              maxFramerate: config.media[type].maxFramerate,
              maxBitrate: this._lowBitrate,
            },
          ]

          transceiverInit.sendEncodings = simulcastEncoding
        }

        const videoTransceiver = this._peerConnection.addTransceiver(
          videoTrack,
          transceiverInit
        )

        if (supportsSetCodecPreferences) {
          videoTransceiver.setCodecPreferences(preferredCodecs)
        } else {
          // TODO: Set codec preferences by modifying the SDP
          for (const preferredCodec of preferredCodecs) {
            const pendingStore = this._pendingPreferredCodecs[type]

            if (Array.isArray(pendingStore)) {
              pendingStore.push(preferredCodec)
            }
          }
        }

        videoTrack.addEventListener('ended', () => {
          if (!this._peerConnection || !videoTransceiver.sender) return
          this._peerConnection.removeTrack(videoTransceiver.sender)
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

    /**
     * negotiate will start negotiation process
     */
    negotiate = async () => {
      if (!this._roomId || !this._clientId) return

      if (!this._peerConnection) return

      const allowNegotiateResponse = await this._api.checkNegotiateAllowed(
        this._roomId,
        this._clientId
      )

      if (!allowNegotiateResponse.ok) {
        this.pendingNegotiation = true
        return
      }

      try {
        const offer = await this._peerConnection.createOffer()
        await this._peerConnection.setLocalDescription(offer)

        if (!this._peerConnection.localDescription) {
          throw new Error('Failed to set the local description on negotiate')
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
        this.pendingNegotiation = true

        // add pending ice candidates if any
        for (const candidate of this._pendingIceCandidates) {
          await this._peerConnection.addIceCandidate(candidate)
        }
      } catch (error) {
        console.error(error)
      }
    }

    /**
     * @param {RTCIceCandidate} candidate
     */
    addIceCandidate = async (candidate) => {
      if (!this._peerConnection) return

      if (!this._peerConnection.remoteDescription) {
        this._pendingIceCandidates.push(candidate)
        return
      }

      try {
        await this._peerConnection.addIceCandidate(candidate)
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

      for (const track of mediaStream.getTracks()) {
        track.addEventListener('ended', () => {
          this.removeStream(mediaStream.id)
        })
      }

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
          InternalPeerEvents.INTERNAL_DATACHANNEL_AVAILABLE,
          internalChannel
        )

        this._videoObserver = new VideoObserver(internalChannel, 1000)

        for (const videoElement of this._pendingObservedVideo) {
          this._videoObserver.observe(videoElement)
        }

        internalChannel.addEventListener('message', (event) => {
          const data = JSON.parse(event.data)

          if (data.type === 'vad_started' || data.type === 'vad_ended') {
            this._onVoiceActivity(data)
          }
        })
      }
    }

    _onBeforeUnload = async () => {
      if (!this._roomId || !this._clientId) return

      this._api.leaveRoom(this._roomId, this._clientId, true)
      this.disconnect()
    }

    /**
     * @param {import('./peer-types.d.ts').RoomPeerType.VoiceActivity} vad
     */
    _onVoiceActivity = (vad) => {
      const event = new CustomEvent('voiceactivity', {
        detail: {
          voiceActivity: vad,
        },
      })

      this.dispatchEvent(event)

      const stream = this._streams.getStream(vad.streamID)

      if (!stream) return

      stream.addVoiceActivity(vad)
    }
  }

  return {
    createInstance: () => {
      const peer = new Peer()

      return {
        connect: peer.connect,
        disconnect: peer.disconnect,
        getClientId: peer.getClientId,
        getRoom: peer.getRoom,
        getRoomId: peer.getRoomId,
        getPeerConnection: peer.getPeerConnection,
        addStream: peer.addStream,
        addIceCandidate: peer.addIceCandidate,
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
        negotiate: peer.negotiate,
        pendingNegotiation: peer.pendingNegotiation,
      }
    },
  }
}
