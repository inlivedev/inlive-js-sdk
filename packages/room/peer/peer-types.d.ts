import type { RoomAPIType } from '../api/api-types.js'
import type { RoomEventType } from '../event/event-types.js'
import type { RoomType } from '../room-types.js'
import type { RoomStreamType } from '../stream/stream-types.js'
import type { createPeer } from './peer.js'

export declare namespace RoomPeerType {
  type CreatePeer = typeof createPeer
  type InstancePeer = {
    connect: (roomId: string, clientId: string) => void
    disconnect: () => void
    getClientId: () => string
    getRoomId: () => string
    getPeerConnection: () => RTCPeerConnection | null
    addStream: (key: string, value: RoomStreamType.StreamParameters) => void
    removeStream: (key: string) => RoomStreamType.InstanceStream | null
    getAllStreams: () => RoomStreamType.InstanceStream[]
    getStream: (key: string) => RoomStreamType.InstanceStream | null
    getStreamByTrackId: (
      trackId: string
    ) => RoomStreamType.InstanceStream | null
    getTotalStreams: () => number
    hasStream: (key: string) => boolean
    turnOnCamera: () => void
    turnOnMic: () => void
    turnOffCamera: () => void
    turnOffMic: () => void
    replaceTrack: (track: MediaStreamTrack) => Promise<void>
    observeVideo: (video: HTMLVideoElement) => void
    unobserveVideo: (video: HTMLVideoElement) => void
  }

  type PeerDependencies = {
    api: RoomAPIType.InstanceApi
    createStream: RoomStreamType.CreateStream
    event: RoomEventType.InstanceEvent
    streams: RoomStreamType.InstanceStreams
    config: RoomType.Config
  }

  type PeerEvents = {
    PEER_CONNECTED: 'peerConnected'
    PEER_DISCONNECTED: 'peerDisconnected'
    STREAM_AVAILABLE: 'streamAvailable'
    STREAM_REMOVED: 'streamRemoved'
    _STREAM_ADDED: 'streamAdded'
    _INTERNAL_DATACHANNEL_AVAILABLE: 'internalDataChannelAvailable'
  }

  type RTCRtpSVCEncodingParameters = RTCRtpEncodingParameters & {
    scalabilityMode?: string
  }

  type RTCRtpSVCTransceiverInit = RTCRtpTransceiverInit & {
    sendEncodings?: RTCRtpSVCEncodingParameters[]
  }

  type AudioLevel = {
    sequence_no: number
    timestamp: number
    audio_level: number
  }

  type VoiceActivity = {
    type: string
    track_id: string
    stream_id: string
    ssrc: number
    clock_rate: number
    audio_levels?: AudioLevel[]
  }

  type VoiceActivityCallback = (voiceActivity: VoiceActivity) => void
}
