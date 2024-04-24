import {
  getBrowserName,
  FIREFOX,
} from '../../internal/utils/get-browser-name.js'
import { VideoObserver } from '../observer/video-observer.js'
import { BandwidthController } from '../bandwidth-controller/bandwidth-controller.js'
import { RoomEvent } from '../index.js'

export const InternalPeerEvents = {
  INTERNAL_DATACHANNEL_AVAILABLE: 'internalDataChannelAvailable',
  REMOTE_STREAM_READY_TO_ADD: 'remoteStreamReadyToAdd',
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
      const isValidStream = this._streams.validateStream(data)

      if (!isValidStream) {
        throw new Error(
          'Please provide valid stream data (clientId, name, origin, source, MediaStream)'
        )
      }

      const stream = this._stream.createInstance({
        id: key,
        ...data,
      })

      this._streams.addStream(key, stream)

      if (stream.origin === 'local') {
        for (const track of stream.mediaStream.getTracks()) {
          if (track.kind === 'video') {
            this._addVideoTrack(track, stream)
          } else if (track.kind === 'audio') {
            this._addAudioTrack(track, stream)
          }
        }
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
     * @param {MediaStreamTrack} [newTrack] sender video track
     */
    turnOnCamera = async (newTrack) => {
      const localStream = this.getAllStreams().find((stream) => {
        return stream.origin === 'local' && stream.source === 'media'
      })

      if (!localStream || !(localStream.mediaStream instanceof MediaStream)) {
        throw new Error(
          'Add local media stream with addStream() before calling this method'
        )
      }

      const videoTrack = localStream.mediaStream.getVideoTracks()[0]

      if (!newTrack && !videoTrack) {
        throw new Error('Cannot find any video track which can be processed')
      }

      if (newTrack) {
        if (newTrack.kind !== 'video') {
          throw new TypeError(`Track must be a video track`)
        } else if (newTrack.readyState === 'ended') {
          throw new Error(`Cannot use a video track which is not running.`)
        }

        if (videoTrack) {
          await this.replaceTrack(newTrack)
          localStream.replaceTrack(newTrack)
          return
        }

        this._addVideoTrack(newTrack, localStream)
        await this.negotiate()
        return
      }

      if (videoTrack) {
        if (videoTrack.readyState === 'ended') {
          throw new Error(
            `Video capture track has been ended. Use turnOnCamera(newTrack) to replace the ended track with a running one.`
          )
        }

        this._setTrackEnabled(videoTrack, true)
        return
      }
    }

    /**
     * Turn on the local microphone
     * @param {MediaStreamTrack} [newTrack] sender audio track
     */
    turnOnMic = async (newTrack) => {
      const localStream = this.getAllStreams().find((stream) => {
        return stream.origin === 'local' && stream.source === 'media'
      })

      if (!localStream || !(localStream.mediaStream instanceof MediaStream)) {
        throw new Error(
          'Add local media stream with addStream() before calling this method'
        )
      }

      const audioTrack = localStream.mediaStream.getAudioTracks()[0]

      if (!newTrack && !audioTrack) {
        throw new Error('Cannot find any audio track which can be processed')
      }

      if (newTrack) {
        if (newTrack.kind !== 'audio') {
          throw new TypeError(`Track must be an audio track`)
        } else if (newTrack.readyState === 'ended') {
          throw new Error(`Cannot use an audio track which is not running.`)
        }

        if (audioTrack) {
          await this.replaceTrack(newTrack)
          localStream.replaceTrack(newTrack)
          return
        }

        this._addAudioTrack(newTrack, localStream)
        await this.negotiate()
        return
      }

      if (audioTrack) {
        if (audioTrack.readyState === 'ended') {
          throw new Error(
            `Audio capture track has been ended. Use turnOnMic(newTrack) to replace the ended track with a running one.`
          )
        }

        this._setTrackEnabled(audioTrack, true)
        return
      }
    }

    /**
     * Turn off the local camera
     * @param {boolean} [stop] Completely stop the camera track
     */
    turnOffCamera = (stop) => {
      const localStream = this._streams.getAllStreams().find((stream) => {
        return stream.origin === 'local' && stream.source === 'media'
      })

      if (!localStream || !(localStream.mediaStream instanceof MediaStream)) {
        throw new Error(
          'Add local media stream with addStream() before calling this method'
        )
      }

      const videoTrack = localStream?.mediaStream.getVideoTracks()[0]

      if (!videoTrack || videoTrack.readyState === 'ended') {
        throw new Error(`No running video track available to be processed.`)
      }

      if (stop) {
        this._stopTrack(videoTrack)
        return
      }

      this._setTrackEnabled(videoTrack, false)
    }

    /**
     * Turn off the local microphone
     * @param {boolean} [stop] Completely stop the microphone track
     */
    turnOffMic = (stop) => {
      const localStream = this._streams.getAllStreams().find((stream) => {
        return stream.origin === 'local' && stream.source === 'media'
      })

      if (!localStream || !(localStream.mediaStream instanceof MediaStream)) {
        throw new Error(
          'Add local media stream with addStream() before calling this method'
        )
      }

      const audioTrack = localStream?.mediaStream.getAudioTracks()[0]

      if (!audioTrack || audioTrack.readyState === 'ended') {
        throw new Error(`No running audio track available to be processed.`)
      }

      if (stop) {
        this._stopTrack(audioTrack)
        return
      }

      this._setTrackEnabled(audioTrack, false)
    }

    /**
     * @param {MediaStreamTrack} newTrack
     */
    replaceTrack = async (newTrack) => {
      if (!this._peerConnection) return

      if (!(newTrack instanceof MediaStreamTrack)) {
        throw new TypeError('Track must be an instance of MediaStreamTrack')
      }

      for (const transceiver of this._peerConnection.getTransceivers()) {
        if (
          transceiver.sender.track &&
          transceiver.sender.track.kind === newTrack.kind
        ) {
          try {
            await transceiver.sender.replaceTrack(newTrack)
          } catch (error) {
            console.error(error)
            throw error
          }
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

      this._event.on(
        InternalPeerEvents.REMOTE_STREAM_READY_TO_ADD,
        /** @param {import('../stream/stream-types.js').RoomStreamType.AddStreamParameters} stream */
        (stream) => {
          if (this.hasStream(stream.mediaStream.id)) return

          stream.mediaStream.addEventListener('removetrack', (event) => {
            const target = event.target

            if (!(target instanceof MediaStream)) return

            if (this.hasStream(target.id) && target.getTracks().length === 0) {
              this.removeStream(target.id)
            }
          })

          for (const track of stream.mediaStream.getTracks()) {
            track.addEventListener('ended', () => {
              this.removeStream(stream.mediaStream.id)
            })
          }

          this.addStream(stream.mediaStream.id, stream)
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
     * @param {MediaStreamTrack} track
     * @param {boolean} enabled
     */
    _setTrackEnabled = (track, enabled = true) => {
      if (!this._peerConnection) return

      if (!(track instanceof MediaStreamTrack)) {
        throw new TypeError('Track must be an instance of MediaStreamTrack')
      }

      for (const transceiver of this._peerConnection.getTransceivers()) {
        const senderTrack = transceiver.sender.track
        if (!senderTrack) continue

        if (senderTrack.kind === track.kind && senderTrack.id === track.id) {
          senderTrack.enabled = enabled
        }
      }
    }

    /**
     * @param {MediaStreamTrack} track
     */
    _stopTrack = (track) => {
      if (!this._peerConnection) return

      if (!(track instanceof MediaStreamTrack)) {
        throw new TypeError('Track must be an instance of MediaStreamTrack')
      }

      for (const transceiver of this._peerConnection.getTransceivers()) {
        const senderTrack = transceiver.sender.track
        if (!senderTrack) continue

        if (senderTrack.kind === track.kind && senderTrack.id === track.id) {
          senderTrack.stop()
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
     * @param {MediaStreamTrack} track
     * @param {import('../stream/stream-types.js').RoomStreamType.InstanceStream} stream
     */
    _addAudioTrack = (track, stream) => {
      if (!(track instanceof MediaStreamTrack)) {
        throw new TypeError('Track must be an instance of MediaStreamTrack')
      }

      if (!stream || !(stream.mediaStream instanceof MediaStream)) {
        throw new Error('Provide stream instance for track destination')
      }

      if (track.kind === 'audio') {
        const audioTrack = stream.mediaStream.getAudioTracks()[0]

        if (!audioTrack) {
          stream.mediaStream.addTrack(track)
        } else if (track.id !== audioTrack.id) {
          stream.replaceTrack(track)
        }

        const transceiver = this._addAudioTransceiver(stream)

        track.addEventListener('ended', () => {
          if (!this._peerConnection || !transceiver?.sender.track) return
          transceiver.sender.track.stop()
          this._peerConnection.removeTrack(transceiver.sender)
          this.removeStream(stream.id)
        })
      }
    }

    /**
     * @param {MediaStreamTrack} track
     * @param {import('../stream/stream-types.js').RoomStreamType.InstanceStream} stream
     */
    _addVideoTrack = (track, stream) => {
      if (!(track instanceof MediaStreamTrack)) {
        throw new TypeError('Track must be an instance of MediaStreamTrack')
      }

      if (!stream || !(stream.mediaStream instanceof MediaStream)) {
        throw new Error('Provide stream instance for track destination')
      }

      if (track.kind === 'video') {
        const videoTrack = stream.mediaStream.getVideoTracks()[0]

        if (!videoTrack) {
          stream.mediaStream.addTrack(track)
        } else if (track.id !== videoTrack.id) {
          stream.replaceTrack(track)
        }

        const transceiver = this._addVideoTransceiver(stream)

        track.addEventListener('ended', () => {
          if (!this._peerConnection || !transceiver?.sender.track) return
          transceiver.sender.track.stop()
          this._peerConnection.removeTrack(transceiver.sender)
          this.removeStream(stream.id)
        })
      }
    }

    /**
     * @param {import('../stream/stream-types.js').RoomStreamType.InstanceStream} stream
     */
    _addAudioTransceiver = (stream) => {
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
          RTCRtpReceiver.getCapabilities('audio')?.codecs || []
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
                }
              }
            }
          } else {
            for (const systemAudioCodec of systemAudioCodecs) {
              if (systemAudioCodec.mimeType === 'audio/red') {
                preferredAudioCodecs.push(systemAudioCodec)
              }
            }
            for (const systemAudioCodec of systemAudioCodecs) {
              if (systemAudioCodec.mimeType === 'audio/opus') {
                preferredAudioCodecs.push(systemAudioCodec)
              }
            }
          }
        }

        // Add all remaining codecs
        for (const audioCodec of systemAudioCodecs) {
          if (!['audio/red', 'audio/opus'].includes(audioCodec.mimeType)) {
            preferredAudioCodecs.push(audioCodec)
          }
        }

        if (supportsSetCodecPreferences) {
          audioTransceiver.setCodecPreferences(preferredAudioCodecs)
        } else {
          // TODO: Set codec preferences by modifying the SDP
          for (const audioCodec of preferredAudioCodecs) {
            this._pendingPreferredCodecs.audio.push(audioCodec)
          }
        }

        return audioTransceiver
      }
    }

    /**
     * @param {import('../stream/stream-types.js').RoomStreamType.InstanceStream} stream
     */
    _addVideoTransceiver = (stream) => {
      if (!this._peerConnection) return
      /** @type {'webcam' | 'screen'} */
      const type = stream.source === 'media' ? 'webcam' : 'screen'

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
          RTCRtpReceiver.getCapabilities('video')?.codecs || []

        for (const videoCodec of config.media[type].videoCodecs) {
          for (const systemVideoCodec of systemVideoCodecs) {
            if (
              systemVideoCodec.mimeType.toLowerCase() ===
              videoCodec.toLowerCase()
            ) {
              preferredCodecs.push(systemVideoCodec)
            }
          }
        }

        // Add all remaining codecs
        for (const videoCodec of systemVideoCodecs) {
          if (!config.media[type].videoCodecs.includes(videoCodec.mimeType)) {
            preferredCodecs.push(videoCodec)
          }
        }

        /** @type {RTCRtpTransceiverInit} */
        const transceiverInit = {
          direction: 'sendonly',
          streams: [stream.mediaStream],
          sendEncodings: [
            {
              maxBitrate: config.media[type].bitrates.high,
              maxFramerate: config.media[type].maxFramerate,
            },
          ],
        }

        const svcEnabled = config.media[type].svc && browserName !== FIREFOX
        const simulcastEnabled = config.media[type].simulcast

        if (simulcastEnabled) {
          /** @type {RTCRtpEncodingParameters[]} */
          let simulcastEncoding = [
            // for firefox order matters... first high resolution, then scaled resolutions...
            {
              rid: 'high',
              maxFramerate: config.media[type].maxFramerate,
              maxBitrate: config.media[type].bitrates.high,
            },
            {
              rid: 'mid',
              // eslint-disable-next-line unicorn/no-zero-fractions
              scaleResolutionDownBy: 2.0,
              maxFramerate: config.media[type].maxFramerate,
              maxBitrate: config.media[type].bitrates.mid,
            },
            {
              rid: 'low',
              // eslint-disable-next-line unicorn/no-zero-fractions
              scaleResolutionDownBy: 4.0,
              maxFramerate: config.media[type].maxFramerate,
              maxBitrate: config.media[type].bitrates.low,
            },
          ]

          transceiverInit.sendEncodings = simulcastEncoding
        }

        if (svcEnabled) {
          if (
            simulcastEnabled &&
            Array.isArray(transceiverInit.sendEncodings)
          ) {
            const sendEncodings = transceiverInit.sendEncodings.map(
              (encoding) => {
                return {
                  ...encoding,
                  scalabilityMode: config.media[type].scalabilityMode,
                }
              }
            )
            transceiverInit.sendEncodings = sendEncodings
          } else {
            const sendEncodings = {
              maxBitrate: config.media[type].bitrates.high,
              scalabilityMode: config.media[type].scalabilityMode,
              maxFramerate: config.media[type].maxFramerate,
            }
            transceiverInit.sendEncodings = [sendEncodings]
          }
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

        return videoTransceiver
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
      const draftStream = this._streams.getDraft(mediaStream.id)

      if (draftStream) {
        const stream = { ...draftStream, mediaStream }

        if (this._streams.validateStream(stream)) {
          this._event.emit(
            InternalPeerEvents.REMOTE_STREAM_READY_TO_ADD,
            stream
          )
        }
      } else {
        this._streams.addDraft(mediaStream.id, {
          clientId: '',
          name: '',
          origin: 'remote',
          source: '',
          mediaStream: mediaStream,
        })
      }
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
          const jsonData = JSON.parse(event.data)

          if (
            jsonData.type === 'vad_started' ||
            jsonData.type === 'vad_ended'
          ) {
            this._onVoiceActivity(jsonData.data)
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
