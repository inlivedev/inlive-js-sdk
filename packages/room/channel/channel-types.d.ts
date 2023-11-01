import type { RoomAPIType } from '../api/api-types.js'
import type { RoomEventType } from '../event/event-types.js'
import type { RoomPeerType } from '../peer/peer-types.js'
import type { RoomStreamType } from '../stream/stream-types.js'
import type { createChannel } from './channel.js'

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
    CHANNEL_OPENED: 'channelOpened'
    CHANNEL_CLOSED: 'channelClosed'
    CHANNEL_NOT_FOUND: 'channelNotFound'
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
