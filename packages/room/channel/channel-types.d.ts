import type { createChannel } from './channel'

export type CreateChannel = typeof createChannel

export type InstanceChannel = ReturnType<
  ReturnType<CreateChannel>['createInstance']
>

export type ChannelDependencies = {
  api: RoomAPIType.InstanceApi
  event: RoomEventType.InstanceEvent
  peer: RoomPeerType.InstancePeer
  streams: RoomStreamType.InstanceStreams
}

export type ChannelEvents = {
  CHANNEL_CONNECTED: 'channelConnected'
  CHANNEL_DISCONNECTED: 'channelDisconnected'
}

export type TrackSource = {
  track_id: string
  source: string
}

export type SubscribingTrack = {
  client_id: string
  stream_id: string
  track_id: string
}

export as namespace RoomChannelType
