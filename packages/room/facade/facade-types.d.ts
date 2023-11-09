import type { RoomAPIType } from '../api/api-types.js'
import type { RoomChannelType } from '../channel/channel-types.js'
import type { RoomEventType } from '../event/event-types.js'
import type { RoomPeerType } from '../peer/peer-types.js'
import type { RoomType } from '../room-types.js'
import type { RoomStreamType } from '../stream/stream-types.js'
import type { createFacade } from './facade.js'

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
  }
}
