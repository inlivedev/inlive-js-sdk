import { PeerEvents } from '../peer/peer.js'

/**
 * @param {import('./bandwidth-controller-types.js').RoomBwControllerType.BwControllerDependencies} dependencies Dependencies for bandwidth controller module
 */
export const createBandwidthController = ({ event, peer }) => {
  const BandwidthController = class {
    _event
    _peer
    _availableOutgoingBitrate
    _lastUpdated
    /** @type {import('./bandwidth-controller-types.js').RoomBwControllerType.InboundTracks} */
    _inboundTracks
    /** @type {import('./bandwidth-controller-types.js').RoomBwControllerType.OutboundTracks} */
    _outboundTracks

    constructor() {
      this._peer = peer
      this._event = event
      this._availableOutgoingBitrate = 0
      this._lastUpdated = 0
      this._inboundTracks = {}
      this._outboundTracks = {}
      this._statsInterval = null
      /** @type {RTCDataChannel | null} */
      this._internalDataChannel = null

      this._event.on(PeerEvents.PEER_CONNECTED, this._onPeerConnected)
      this._event.on(PeerEvents.PEER_DISCONNECTED, this._onPeerDisconnected)
      this._event.on(
        PeerEvents._INTERNAL_DATACHANNEL_AVAILABLE,
        this._onInternalDataChannelAvailable
      )
    }

    getVideoOutboundTracksLength = () => {
      let length = 0
      for (const trackId of Object.keys(this._outboundTracks)) {
        if (this._outboundTracks[trackId].kind === 'video') {
          length++
        }
      }
      return length
    }

    getAudioOutboundTracksLength = () => {
      let length = 0
      for (const trackId of Object.keys(this._outboundTracks)) {
        if (this._outboundTracks[trackId].kind === 'audio') {
          length++
        }
      }
      return length
    }

    getAvailable = async () => {
      await this._updateStats()
      return this._availableOutgoingBitrate
    }

    getOutbountStats() {
      const stats = {
        audio: {
          totalBitrates: 0,
          count: 0,
        },
        video: {
          totalBitrates: 0,
          count: 0,
        },
      }

      let isZeroBitrate = false

      for (const trackId of Object.keys(this._outboundTracks)) {
        if (
          this._outboundTracks[trackId].kind === 'audio' &&
          (this._outboundTracks[trackId].rid === 'high' ||
            this._outboundTracks[trackId].rid === '')
        ) {
          if (this._outboundTracks[trackId].bitrates === 0) {
            isZeroBitrate = true
            return
          }
          stats.audio.count++
          stats.audio.totalBitrates += this._outboundTracks[trackId].bitrates
        } else {
          if (this._outboundTracks[trackId].bitrates === 0) {
            isZeroBitrate = true
            return
          }
          stats.video.count++
          stats.video.totalBitrates += this._outboundTracks[trackId].bitrates
        }
      }

      if (isZeroBitrate) return null

      return stats
    }

    _onPeerConnected = () => {
      if (this._statsInterval) {
        clearInterval(this._statsInterval)
        this._statsInterval = null
      }

      this._statsInterval = setInterval(this._updateStats, 3000)
    }

    _onPeerDisconnected = () => {
      if (this._statsInterval) {
        clearInterval(this._statsInterval)
        this._statsInterval = null
      }
    }

    /**
     * @param {RTCDataChannel} datachannel
     */
    _onInternalDataChannelAvailable = (datachannel) => {
      this._internalDataChannel = datachannel
    }

    _updateStats = async () => {
      const peerConnection = this._peer.getPeerConnection()

      if (Date.now() - this._lastUpdated < 1000 || !peerConnection) {
        return
      }

      const stats = await peerConnection.getStats()
      this._lastUpdated = Date.now()
      let cpu = false
      let bandwidth = false

      for (const [, report] of stats) {
        switch (report.type) {
          case 'inbound-rtp':
            this._processInboundStats(report)
            break

          case 'outbound-rtp':
            this._processOutboundStats(report)
            if (report.qualityLimitationReason === 'cpu') {
              cpu = true
            } else if (report.qualityLimitationReason === 'bandwidth') {
              bandwidth = true
            }
            break

          case 'candidate-pair':
            if (typeof report.availableOutgoingBitrate !== 'undefined') {
              this._availableOutgoingBitrate = report.availableOutgoingBitrate
            }
            break

          default:
            break
        }
      }

      let reason = 'none'

      if (cpu && bandwidth) reason = 'both'
      else if (cpu) reason = 'cpu'
      else if (bandwidth) reason = 'bandwidth'

      this._sendStats({
        available_outgoing_bitrate: this._availableOutgoingBitrate,
        quality_limitation_reason: reason,
      })
    }

    /**
     * @param {import('./bandwidth-controller-types.js').RoomBwControllerType.PublisherStatsData} stats
     */
    _sendStats = async (stats) => {
      if (!this._internalDataChannel) return
      if (this._internalDataChannel.readyState !== 'open') return

      /** @type {import('./bandwidth-controller-types.js').RoomBwControllerType.PublisherStatsReport} */
      const statsReport = {
        type: 'stats',
        data: stats,
      }

      this._internalDataChannel.send(JSON.stringify(statsReport))
    }

    /**
     * @param {import('./bandwidth-controller-types.js').RoomBwControllerType.RTCInboundRtpStreamStatsExtra} report
     */
    _processInboundStats = (report) => {
      const trackId = report.trackIdentifier
      const bytesReceived = report.bytesReceived || 0

      if (typeof this._inboundTracks[trackId] === 'undefined') {
        this._inboundTracks[trackId] = {
          source:
            this._peer.getStreamByTrackId(report.trackIdentifier)?.source || '',
          kind: report.kind,
          bytesReceived: 0,
          bitrate: 0,
          lastUpdated: 0,
        }
      }

      if (
        this._inboundTracks[trackId].bytesReceived === 0 ||
        bytesReceived === 0 ||
        this._inboundTracks[trackId].lastUpdated === 0
      ) {
        this._inboundTracks[trackId].bytesReceived = bytesReceived
        this._inboundTracks[trackId].lastUpdated = this._lastUpdated
        return
      }

      const deltaBytes =
        bytesReceived - this._inboundTracks[trackId].bytesReceived

      this._inboundTracks[trackId].bytesReceived = bytesReceived

      let bitrate = 0

      const deltaMs =
        this._lastUpdated - this._inboundTracks[trackId].lastUpdated
      bitrate = ((deltaBytes * 8) / deltaMs) * 1000

      this._inboundTracks[trackId].bitrate = bitrate
      this._inboundTracks[trackId].lastUpdated = this._lastUpdated
    }

    /**
     * @param {import('./bandwidth-controller-types.js').RoomBwControllerType.RTCOutboundRtpStreamStatsExtra} report
     */
    _processOutboundStats = (report) => {
      const trackId = report.id

      if (typeof this._outboundTracks[trackId] === 'undefined') {
        this._outboundTracks[trackId] = {
          rid: report.rid || '',
          kind: report.kind,
          bytesSent: 0,
          bitrates: 0,
          lastUpdated: 0,
        }
      }

      if (this._outboundTracks[trackId].bytesSent === 0) {
        this._outboundTracks[trackId].bytesSent = report.bytesSent || 0
        this._outboundTracks[trackId].lastUpdated = this._lastUpdated
      }

      const deltaMs =
        this._lastUpdated - this._outboundTracks[trackId].lastUpdated

      const deltaBytes =
        report.bytesSent || 0 - this._outboundTracks[trackId].bytesSent

      const bitrate = Math.floor(((deltaBytes * 8) / deltaMs) * 1000)

      if (bitrate === 0) return

      this._outboundTracks[trackId].bytesSent = report.bytesSent || 0
      this._outboundTracks[trackId].bitrates = bitrate
      this._outboundTracks[trackId].lastUpdated = this._lastUpdated
    }
  }

  return {
    createInstance: () => {
      const bandwidthController = new BandwidthController()

      return {
        getVideoOutboundTracksLength:
          bandwidthController.getVideoOutboundTracksLength,
        getAudioOutboundTracksLength:
          bandwidthController.getAudioOutboundTracksLength,
        getAvailable: bandwidthController.getAvailable,
        getOutbountStats: bandwidthController.getOutbountStats,
      }
    },
  }
}
