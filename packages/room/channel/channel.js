import { PeerEvents } from '../peer/peer.js'

/** @type {import('./channel-types.js').RoomChannelType.ChannelEvents} */
export const ChannelEvents = {
  CHANNEL_OPENED: 'channelOpened',
  CHANNEL_CLOSED: 'channelClosed',
}

export const REASONS = {
  CLOSED: 'closed',
  NOT_FOUND: 'notfound',
  RECONNECT: 'reconnect',
}

/**
 * @param {import('./channel-types.js').RoomChannelType.ChannelDependencies} channelDependencies Dependencies for channel module
 */
export const createChannel = ({ api, event, peer, streams }) => {
  const Channel = class {
    _roomId = ''
    _clientId = ''
    _baseUrl
    _api
    _event
    _peer
    _streams
    /** @type {EventSource | null} */
    _channel = null
    _startTime
    _reconnecting

    /**
     * @param {string} baseUrl
     */
    constructor(baseUrl) {
      this._baseUrl = baseUrl
      this._api = api
      this._event = event
      this._peer = peer
      this._streams = streams
      this._startTime = 0
      this._reconnecting = false

      this._event.on(PeerEvents.PEER_OPENED, this._onPeerOpened)
      this._event.on(PeerEvents.PEER_CLOSED, this._onPeerClosed)
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

      const channel = new EventSource(
        `${this._baseUrl}/rooms/${this._roomId}/events/${this._clientId}`
      )

      this._startTime = Date.now()
      this._channel = channel
      this._addEventListener()
    }

    /**
     * Disconnect from the Signaling Channel
     */
    disconnect = () => {
      if (!this._channel) return

      this._removeEventListener()
      this._channel.close()
      this._channel = null
    }

    _addEventListener = () => {
      if (!this._channel) return

      this._channel.addEventListener('open', this._onOpen)
      this._channel.addEventListener('error', this._onError)
      this._channel.addEventListener('candidate', this._onCandidate)
      this._channel.addEventListener('offer', this._onOffer)
      this._channel.addEventListener('tracks_added', this._onTracksAdded)
      this._channel.addEventListener(
        'tracks_available',
        this._onTracksAvailable
      )
    }

    _removeEventListener = () => {
      if (!this._channel) return

      this._channel.removeEventListener('open', this._onOpen)
      this._channel.removeEventListener('error', this._onError)
      this._channel.removeEventListener('candidate', this._onCandidate)
      this._channel.removeEventListener('offer', this._onOffer)
      this._channel.removeEventListener('tracks_added', this._onTracksAdded)
      this._channel.removeEventListener(
        'tracks_available',
        this._onTracksAvailable
      )
    }

    _reconnect = () => {
      if (
        this._channel?.readyState === EventSource.CLOSED &&
        !this._reconnecting
      ) {
        this._reconnecting = true
        this.disconnect()
        this._event.emit(ChannelEvents.CHANNEL_CLOSED, {
          reason: REASONS.RECONNECT,
        })
        this.connect(this._roomId, this._clientId)
        this._reconnecting = false
      }
    }

    _onOpen = () => {
      this._event.emit(ChannelEvents.CHANNEL_OPENED)
    }

    _onError = async () => {
      const errorTime = Date.now()

      if (this._roomId && this._clientId) {
        const response = await this._api.getClient(this._roomId, this._clientId)

        if (response.code === 404) {
          this.disconnect()
          this._event.emit(ChannelEvents.CHANNEL_CLOSED, {
            reason: REASONS.NOT_FOUND,
          })
          return
        }

        // Reconnect
        if (errorTime - this._startTime < 1000) {
          setTimeout(() => {
            this._reconnect()
          }, 1000)
        } else {
          this._reconnect()
        }
      }
    }

    /**
     * @param {{ roomId: string, clientId: string }} data
     */
    _onPeerOpened = (data) => {
      if (!data) {
        throw new Error('Channel failed to connect')
      }

      this.connect(data.roomId, data.clientId)
    }

    _onPeerClosed = () => {
      this.disconnect()
      this._event.emit(ChannelEvents.CHANNEL_CLOSED, { reason: REASONS.CLOSED })
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
      await peerConnection.addIceCandidate(candidate)
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
        await this._api.negotiateConnection(
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
      /** @type {import('./channel-types.js').RoomChannelType.TrackSource[]} */
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

      await this._api.setTrackSources(
        this._roomId,
        this._clientId,
        trackSources
      )
    }

    /**
     * @param {MessageEvent} event
     */
    _onTracksAvailable = async (event) => {
      const data = JSON.parse(event.data)
      /** @type {import('./channel-types.js').RoomChannelType.SubscribingTrack[]} */
      const subscribingTracks = []

      for (const id of Object.keys(data.tracks)) {
        const track = data.tracks[id]
        const streamId = track.stream_id
        const clientId = track.client_id
        const clientName = track.client_name
        const trackId = track.track_id
        const source = track.source

        subscribingTracks.push({
          client_id: clientId,
          stream_id: streamId,
          track_id: trackId,
        })

        if (!this._streams.getDraft(streamId)) {
          this._streams.addDraft(streamId, {
            clientId: clientId,
            name: clientName,
            origin: 'remote',
            source: source,
          })
        }
      }

      await this._api.subscribeTracks(
        this._roomId,
        this._clientId,
        subscribingTracks
      )
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
