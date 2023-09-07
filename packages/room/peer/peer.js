/** @type {import('./peer-types.js').RoomPeerType.PeerEvents} */
export const PeerEvents = {
  PEER_CONNECTED: 'peerConnected',
  PEER_DISCONNECTED: 'peerDisconnected',
  STREAM_ADDED: 'streamAdded',
  STREAM_REMOVED: 'streamRemoved',
  _ADD_LOCAL_MEDIA_STREAM: 'addLocalMediaStream',
  _ADD_LOCAL_SCREEN_STREAM: 'addLocalScreenStream',
}

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

    constructor() {
      this._api = api
      this._event = event
      this._streams = streams
      this._stream = createStream()
    }

    /**
     * Initiate a peer connection
     * @param {string} roomId
     * @param {string} clientId
     */
    connect = (roomId, clientId) => {
      if (this._peerConnection) return

      this._roomId = roomId
      this._clientId = clientId

      this._peerConnection = new RTCPeerConnection({
        iceServers: config.webrtc.iceServers,
      })

      this._addEventListener()
      this._event.emit(PeerEvents.PEER_CONNECTED, {
        roomId: this._roomId,
        clientId: this._clientId,
      })
    }

    disconnect = () => {
      if (!this._peerConnection) return

      for (const sender of this._peerConnection.getSenders()) {
        if (!sender.track) return
        sender.track.enabled = false
        sender.track.stop()
      }

      this._removeEventListener()
      this._peerConnection.close()
      this._peerConnection = null
      this._event.emit(PeerEvents.PEER_DISCONNECTED)
    }

    getPeerConnection = () => {
      return Object.freeze(this._peerConnection)
    }

    /**
     * Add a new stream
     * @param {string} key
     * @param {import('../stream/stream-types.js').RoomStreamType.AddStreamParameters} data
     * @returns {import('../stream/stream-types.js').RoomStreamType.InstanceStream} Returns the added stream data
     */
    addStream = (key, data) => {
      this._streams.validateKey(key)
      this._streams.validateStream(data)

      const stream = this._stream.createInstance({
        id: key,
        ...data,
      })

      this._streams.addStream(key, stream)

      if (stream.origin === 'local' && stream.source === 'media') {
        this._event.emit(PeerEvents._ADD_LOCAL_MEDIA_STREAM, {
          stream,
        })
      }

      if (stream.origin === 'local' && stream.source === 'screen') {
        this._event.emit(PeerEvents._ADD_LOCAL_SCREEN_STREAM, {
          stream,
        })
      }

      this._event.emit(PeerEvents.STREAM_ADDED, { stream })

      return stream
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

      this._event.on(
        PeerEvents._ADD_LOCAL_MEDIA_STREAM,
        this._onAddLocalMediaStream
      )

      this._event.on(
        PeerEvents._ADD_LOCAL_SCREEN_STREAM,
        this._onAddLocalScreenStream
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
        'negotiationneeded',
        this._onNegotiationNeeded
      )

      this._peerConnection.removeEventListener(
        'icecandidate',
        this._onIceCandidate
      )

      this._peerConnection.removeEventListener('track', this._onTrack)

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
        this._api.sendIceCandidate(this._roomId, this._clientId, candidate)
      }
    }

    /**
     * @param {RTCTrackEvent} event
     */
    _onTrack = async (event) => {
      const mediaStream = event.streams.find((stream) => stream.active === true)

      const track = event.track

      if (!(mediaStream instanceof MediaStream)) return

      if (this.hasStream(mediaStream.id)) return

      track.addEventListener('ended', () => {
        console.log('remote track ended')
      })

      mediaStream.addEventListener('removetrack', (event) => {
        const target = event.target

        if (!(target instanceof MediaStream)) return

        if (this.hasStream(target.id) && target.getTracks().length === 0) {
          this.removeStream(target.id)
        }
      })

      const draftStream = this._streams.getDraft(mediaStream.id) || {}

      this.addStream(mediaStream.id, {
        origin: draftStream.origin || 'remote',
        source: draftStream.source || 'media',
        mediaStream: mediaStream,
      })

      this._streams.removeDraft(mediaStream.id)
    }

    _onBeforeUnload = async () => {
      if (!this._roomId || !this._clientId) return

      this.disconnect()
      await this._api.leaveRoom(this._roomId, this._clientId)
    }

    /**
     * @param {{ stream: import('../stream/stream-types.js').RoomStreamType.InstanceStream }} data
     */
    _onAddLocalMediaStream = ({ stream }) => {
      if (!this._peerConnection) return

      for (const track of stream.mediaStream.getTracks()) {
        this._peerConnection.addTrack(track, stream.mediaStream)
      }
    }

    /**
     * @param {{ stream: import('../stream/stream-types.js').RoomStreamType.InstanceStream }} data
     */
    _onAddLocalScreenStream = ({ stream }) => {
      if (!this._peerConnection) return

      for (const track of stream.mediaStream.getTracks()) {
        const sender = this._peerConnection.addTrack(track, stream.mediaStream)

        track.addEventListener('ended', () => {
          if (!this._peerConnection) return

          this.removeStream(stream.id)
          if (!sender) return
          this._peerConnection.removeTrack(sender)
        })
      }

      stream.mediaStream.addEventListener('removetrack', (event) => {
        const target = event.target

        if (!(target instanceof MediaStream)) return

        if (this.hasStream(target.id) && target.getTracks().length === 0) {
          this.removeStream(target.id)
        }
      })
    }
  }

  return {
    createInstance: () => {
      const peer = new Peer()

      return {
        connect: peer.connect,
        disconnect: peer.disconnect,
        getPeerConnection: peer.getPeerConnection,
        addStream: peer.addStream,
        removeStream: peer.removeStream,
        getAllStreams: peer.getAllStreams,
        getStream: peer.getStream,
        getTotalStreams: peer.getTotalStreams,
        hasStream: peer.hasStream,
        turnOnCamera: peer.turnOnCamera,
        turnOnMic: peer.turnOnMic,
        turnOffCamera: peer.turnOffCamera,
        turnOffMic: peer.turnOffMic,
      }
    },
  }
}
