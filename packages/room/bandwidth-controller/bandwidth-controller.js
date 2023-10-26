import { PeerEvents } from '../peer/peer.js'

export class BandwidthController {
  #event
  #peer
  #availableOutgoingBitrate
  #lastUpdated
  /** @type {import('./bandwidth-controller-types.js').RoomBwControllerType.InboundTracks} */
  #inboundTracks
  /** @type {import('./bandwidth-controller-types.js').RoomBwControllerType.OutboundTracks} */
  #outboundTracks
  /** @type {ReturnType<typeof setInterval> | null} */
  #statsInterval
  /** @type {RTCDataChannel | null} */
  #internalDataChannel

  /**
   * @param {import('./bandwidth-controller-types.js').RoomBwControllerType.BwControllerDependencies} dependencies Dependencies for bandwidth controller module
   */
  constructor({ event, peer }) {
    this.#peer = peer
    this.#event = event
    this.#availableOutgoingBitrate = 0
    this.#lastUpdated = 0
    this.#inboundTracks = {}
    this.#outboundTracks = {}
    this.#statsInterval = null
    this.#internalDataChannel = null

    this.#event.on(PeerEvents.PEER_CONNECTED, this.#onPeerConnected)
    this.#event.on(PeerEvents.PEER_DISCONNECTED, this.#onPeerDisconnected)
    this.#event.on(
      PeerEvents._INTERNAL_DATACHANNEL_AVAILABLE,
      this.#onInternalDataChannelAvailable
    )
  }

  getVideoOutboundTracksLength = () => {
    let length = 0
    for (const trackId of Object.keys(this.#outboundTracks)) {
      if (this.#outboundTracks[trackId].kind === 'video') {
        length++
      }
    }
    return length
  }

  getAudioOutboundTracksLength = () => {
    let length = 0
    for (const trackId of Object.keys(this.#outboundTracks)) {
      if (this.#outboundTracks[trackId].kind === 'audio') {
        length++
      }
    }
    return length
  }

  getAvailable = async () => {
    await this.#updateStats()
    return this.#availableOutgoingBitrate
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

    for (const trackId of Object.keys(this.#outboundTracks)) {
      if (
        this.#outboundTracks[trackId].kind === 'audio' &&
        (this.#outboundTracks[trackId].rid === 'high' ||
          this.#outboundTracks[trackId].rid === '')
      ) {
        if (this.#outboundTracks[trackId].bitrates === 0) {
          isZeroBitrate = true
          return
        }
        stats.audio.count++
        stats.audio.totalBitrates += this.#outboundTracks[trackId].bitrates
      } else {
        if (this.#outboundTracks[trackId].bitrates === 0) {
          isZeroBitrate = true
          return
        }
        stats.video.count++
        stats.video.totalBitrates += this.#outboundTracks[trackId].bitrates
      }
    }

    if (isZeroBitrate) return null

    return stats
  }

  #onPeerConnected = () => {
    if (this.#statsInterval) {
      clearInterval(this.#statsInterval)
      this.#statsInterval = null
    }

    this.#statsInterval = setInterval(this.#updateStats, 3000)
  }

  #onPeerDisconnected = () => {
    if (this.#statsInterval) {
      clearInterval(this.#statsInterval)
      this.#statsInterval = null
    }
  }

  /**
   * @param {RTCDataChannel} datachannel
   */
  #onInternalDataChannelAvailable = (datachannel) => {
    this.#internalDataChannel = datachannel
  }

  #updateStats = async () => {
    const peerConnection = this.#peer.getPeerConnection()

    if (Date.now() - this.#lastUpdated < 1000 || !peerConnection) {
      return
    }

    const stats = await peerConnection.getStats()
    this.#lastUpdated = Date.now()
    let cpu = false
    let bandwidth = false

    for (const [, report] of stats) {
      switch (report.type) {
        case 'inbound-rtp':
          this.#processInboundStats(report)
          break

        case 'outbound-rtp':
          this.#processOutboundStats(report)
          if (report.qualityLimitationReason === 'cpu') {
            cpu = true
          } else if (report.qualityLimitationReason === 'bandwidth') {
            bandwidth = true
          }
          break

        case 'candidate-pair':
          if (typeof report.availableOutgoingBitrate !== 'undefined') {
            this.#availableOutgoingBitrate = report.availableOutgoingBitrate
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

    this.#sendStats({
      available_outgoing_bitrate: this.#availableOutgoingBitrate,
      quality_limitation_reason: reason,
    })
  }

  /**
   * @param {import('./bandwidth-controller-types.js').RoomBwControllerType.PublisherStatsData} stats
   */
  #sendStats = async (stats) => {
    if (!this.#internalDataChannel) return
    if (this.#internalDataChannel.readyState !== 'open') return

    /** @type {import('./bandwidth-controller-types.js').RoomBwControllerType.PublisherStatsReport} */
    const statsReport = {
      type: 'stats',
      data: stats,
    }

    this.#internalDataChannel.send(JSON.stringify(statsReport))
  }

  /**
   * @param {import('./bandwidth-controller-types.js').RoomBwControllerType.RTCInboundRtpStreamStatsExtra} report
   */
  #processInboundStats = (report) => {
    const trackId = report.trackIdentifier
    const bytesReceived = report.bytesReceived || 0

    if (typeof this.#inboundTracks[trackId] === 'undefined') {
      this.#inboundTracks[trackId] = {
        source:
          this.#peer.getStreamByTrackId(report.trackIdentifier)?.source || '',
        kind: report.kind,
        bytesReceived: 0,
        bitrate: 0,
        lastUpdated: 0,
      }
    }

    if (
      this.#inboundTracks[trackId].bytesReceived === 0 ||
      bytesReceived === 0 ||
      this.#inboundTracks[trackId].lastUpdated === 0
    ) {
      this.#inboundTracks[trackId].bytesReceived = bytesReceived
      this.#inboundTracks[trackId].lastUpdated = this.#lastUpdated
      return
    }

    const deltaBytes =
      bytesReceived - this.#inboundTracks[trackId].bytesReceived

    this.#inboundTracks[trackId].bytesReceived = bytesReceived

    let bitrate = 0

    const deltaMs = this.#lastUpdated - this.#inboundTracks[trackId].lastUpdated
    bitrate = ((deltaBytes * 8) / deltaMs) * 1000

    this.#inboundTracks[trackId].bitrate = bitrate
    this.#inboundTracks[trackId].lastUpdated = this.#lastUpdated
  }

  /**
   * @param {import('./bandwidth-controller-types.js').RoomBwControllerType.RTCOutboundRtpStreamStatsExtra} report
   */
  #processOutboundStats = (report) => {
    const trackId = report.id

    if (typeof this.#outboundTracks[trackId] === 'undefined') {
      this.#outboundTracks[trackId] = {
        rid: report.rid || '',
        kind: report.kind,
        bytesSent: 0,
        bitrates: 0,
        lastUpdated: 0,
      }
    }

    if (this.#outboundTracks[trackId].bytesSent === 0) {
      this.#outboundTracks[trackId].bytesSent = report.bytesSent || 0
      this.#outboundTracks[trackId].lastUpdated = this.#lastUpdated
    }

    const deltaMs =
      this.#lastUpdated - this.#outboundTracks[trackId].lastUpdated

    const deltaBytes =
      report.bytesSent || 0 - this.#outboundTracks[trackId].bytesSent

    const bitrate = Math.floor(((deltaBytes * 8) / deltaMs) * 1000)

    if (bitrate === 0) return

    this.#outboundTracks[trackId].bytesSent = report.bytesSent || 0
    this.#outboundTracks[trackId].bitrates = bitrate
    this.#outboundTracks[trackId].lastUpdated = this.#lastUpdated
  }
}
