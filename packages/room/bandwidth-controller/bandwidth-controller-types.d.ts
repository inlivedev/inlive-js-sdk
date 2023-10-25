import type { RoomPeerType } from '../peer/peer-types.js'
import type { RoomEventType } from '../event/event-types.js'
import type { createBandwidthController } from './bandwidth-controller.js'

export declare namespace RoomBwControllerType {
  type CreateBwController = typeof createBandwidthController

  type BwControllerDependencies = {
    event: RoomEventType.InstanceEvent
    peer: RoomPeerType.InstancePeer
  }

  type TrackInboundStats = {
    kind: string
    source: string
    bytesReceived: number
    bitrate: number
    lastUpdated: number
  }

  type TrackOutboundStats = {
    rid: string
    kind: string
    bytesSent: number
    bitrates: number
    lastUpdated: number
  }

  type PublisherStatsData = {
    available_outgoing_bitrate: number
    quality_limitation_reason: string
  }

  type PublisherStatsReport = {
    type: string
    data: PublisherStatsData
  }

  type InboundTracks = {
    [key: string]: TrackInboundStats
  }

  type OutboundTracks = {
    [key: string]: TrackOutboundStats
  }

  type RTCInboundRtpStreamStatsExtra = RTCInboundRtpStreamStats & {
    trackIdentifier: string
  }

  type RTCOutboundRtpStreamStatsExtra = RTCOutboundRtpStreamStats & {
    qualityLimitationReason?: string
  }
}
