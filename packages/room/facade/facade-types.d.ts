import type { RoomAPIType } from '../api/api-types.js'
import type { RoomType } from '../room-types.js'
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
  }
}
