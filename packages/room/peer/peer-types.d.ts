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
    getPeerConnection: () => RTCPeerConnection | null
    addStream: (key: string, value: RoomStreamType.StreamParameters) => void
    removeStream: (key: string) => RoomStreamType.InstanceStream | null
    getAllStreams: () => RoomStreamType.InstanceStream[]
    getStream: (key: string) => RoomStreamType.InstanceStream | null
    getTotalStreams: () => number
    hasStream: (key: string) => boolean
    turnOnCamera: () => void
    turnOnMic: () => void
    turnOffCamera: () => void
    turnOffMic: () => void
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
    STREAM_ADDED: 'streamAdded'
    STREAM_REMOVED: 'streamRemoved'
    _ADD_LOCAL_MEDIA_STREAM: 'addLocalMediaStream'
    _ADD_LOCAL_SCREEN_STREAM: 'addLocalScreenStream'
  }
}
