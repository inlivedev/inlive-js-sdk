import type { RoomAPIType } from '../api/api-types'
import type { RoomChannelType } from '../channel/channel-types'
import type { RoomEventType } from '../event/event-types'
import type { RoomPeerType } from '../peer/peer-types'
import type { RoomType } from '../room-types'
import type { RoomStreamType } from '../stream/stream-types'
import type { createFacade } from './facade'

export declare namespace RoomFacadeType {
  type CreateFacade = typeof createFacade
  type Facade = ReturnType<CreateFacade>
  type CreateInstanceFacade = ReturnType<CreateFacade>['createInstance']

  type FacadeDependencies = {
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
}
