import type { createFacade } from './facade'

export type CreateFacade = typeof createFacade
export type Facade = ReturnType<CreateFacade>
export type CreateInstanceFacade = ReturnType<CreateFacade>['createInstance']

export type FacadeDependencies = {
  config: RoomType.Config
  api: {
    createFetcher: RoomAPIType.CreateFetcher
    createApi: RoomAPIType.CreateApi
  }
  event: {
    createEvent: RoomEventType.CreateEvent
  }
  stream: {
    createStream: RoomStreamType.CreateStream
    createStreams: RoomStreamType.CreateStreams
  }
  peer: {
    createPeer: RoomPeerType.CreatePeer
  }
  channel: {
    createChannel: RoomChannelType.CreateChannel
  }
  roomEvents: {
    peer: RoomPeerType.PeerEvents
    channel: RoomChannelType.ChannelEvents
  }
}

export as namespace RoomFacadeType
