/**
 * @param {RoomChannelType.ChannelDependencies} channelDependencies
 */
export const createChannel = ({ api, peer, streams }) => {
  const Channel = class {
    _roomId = ''
    _clientId = ''
    _baseUrl
    _api
    _peer
    _streams
    /** @type {EventSource | null} */
    _channel = null

    /**
     * @param {string} baseUrl
     */
    constructor(baseUrl) {
      this._baseUrl = baseUrl
      this._api = api
      this._peer = peer
      this._streams = streams
    }

    /**
     * Connect to the Signaling Channel
     * @param {string} roomId
     * @param {string} clientId
     */
    connect = (roomId, clientId) => {
      if (this._channel) return

      this._roomId = roomId
      this._clientId = clientId

      this._channel = new EventSource(
        `${this._baseUrl}/rooms/${this._roomId}/events/${this._clientId}`
      )

      this._channel.addEventListener('candidate', this._onCandidate)
      this._channel.addEventListener('offer', this._onOffer)
      this._channel.addEventListener('tracks_added', this._onTracksAdded)
      this._channel.addEventListener(
        'tracks_available',
        this._onTracksAvailable
      )
      this._channel.addEventListener(
        'allowed_renegotation',
        this._onAllowedRenegotiation
      )
    }

    /**
     * @param {MessageEvent} event
     */
    _onCandidate = async (event) => {
      const peerConnection = this._peer.getPeerConnection()

      if (!peerConnection || !peerConnection.remoteDescription) {
        return
      }

      const candidate = new RTCIceCandidate(JSON.parse(event.data))
      peerConnection.addIceCandidate(candidate)
    }

    /**
     * @param {MessageEvent} event
     */
    _onOffer = async (event) => {
      if (!this._roomId || !this._clientId) return

      const peerConnection = this._peer.getPeerConnection()

      if (!peerConnection) return

      const offer = JSON.parse(event.data)
      await peerConnection.setRemoteDescription(offer)
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      if (peerConnection.localDescription) {
        this._api.negotiateConnection(
          this._roomId,
          this._clientId,
          peerConnection.localDescription
        )
      }
    }

    /**
     * @param {MessageEvent} event
     */
    _onTracksAdded = async (event) => {
      const data = JSON.parse(event.data)
      /** @type {RoomChannelType.TrackSource[]} */
      const trackSources = []

      for (const id of Object.keys(data.tracks)) {
        const track = data.tracks[id]
        const streamId = track.stream_id
        const stream = this._peer.getStream(streamId)

        if (stream) {
          trackSources.push({
            track_id: id,
            source: stream.source,
          })
        }
      }

      this._api.setTrackSources(this._roomId, this._clientId, trackSources)
    }

    /**
     * @param {MessageEvent} event
     */
    _onTracksAvailable = async (event) => {
      const data = JSON.parse(event.data)
      /** @type {RoomChannelType.SubscribingTrack[]} */
      const subscribingTracks = []

      for (const id of Object.keys(data.tracks)) {
        const track = data.tracks[id]
        const streamId = track.stream_id
        const clientId = track.client_id
        const trackId = track.track_id
        const source = track.source

        subscribingTracks.push({
          client_id: clientId,
          stream_id: streamId,
          track_id: trackId,
        })

        this._streams.addDraft(streamId, {
          origin: 'remote',
          source: source,
        })
      }

      this._api.subscribeTracks(this._roomId, this._clientId, subscribingTracks)
    }

    _onAllowedRenegotiation = () => {
      // TODO: Handle allowed_renegotation event
    }
  }

  return {
    /**
     * @param {string} baseUrl
     */
    createInstance: (baseUrl) => {
      const channel = new Channel(baseUrl)

      return {
        connect: channel.connect,
      }
    },
  }
}
