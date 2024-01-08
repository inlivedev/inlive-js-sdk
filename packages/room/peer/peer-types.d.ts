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
    addStream: (key: string, value: RoomStreamType.AddStreamParameters) => void
    addIceCandidate: (candidate: RTCIceCandidate) => void
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

  type RTCRtpSVCEncodingParameters = RTCRtpEncodingParameters & {
    scalabilityMode?: string
  }

  type RTCRtpSVCTransceiverInit = RTCRtpTransceiverInit & {
    sendEncodings?: RTCRtpSVCEncodingParameters[]
  }

  type AudioLevel = {
    sequenceNo: number
    timestamp: number
    audioLevel: number
  }

  type VoiceActivity = {
    type: string
    trackID: string
    streamID: string
    ssrc: number
    clockRate: number
    audioLevels?: AudioLevel[]
  }

  type VoiceActivityCallback = (voiceActivity: VoiceActivity) => void
}
