import type { RoomAPIType } from '../api/api-types'
import type { RoomEventType } from '../event/event-types'
import type { RoomPeerType } from '../peer/peer-types'
import type { RoomStreamType } from '../stream/stream-types'
import type { createChannel } from './channel'

export declare namespace RoomChannelType {
  type CreateChannel = typeof createChannel

  type InstanceChannel = ReturnType<ReturnType<CreateChannel>['createInstance']>

  type ChannelDependencies = {
    api: RoomAPIType.InstanceApi
    event: RoomEventType.InstanceEvent
    peer: RoomPeerType.InstancePeer
    streams: RoomStreamType.InstanceStreams
  }

  type ChannelEvents = {
    CHANNEL_CONNECTED: 'channelConnected'
    CHANNEL_DISCONNECTED: 'channelDisconnected'
  }

  type TrackSource = {
    track_id: string
    source: string
  }

  type SubscribingTrack = {
    client_id: string
    stream_id: string
    track_id: string
  }
}
