import type { createFetcher } from './fetcher.js'
import type { createApi } from './api.js'

export declare namespace RoomAPIType {
  type CreateFetcher = typeof createFetcher
  type CreateApi = typeof createApi

  type InstanceFetcher = ReturnType<ReturnType<CreateFetcher>['createInstance']>
  type InstanceApi = ReturnType<ReturnType<CreateApi>['createInstance']>

  type ApiDependencies = {
    fetcher: RoomAPIType.InstanceFetcher
  }

  type TrackSourcesRequestBody = {
    track_id: string
    source: string
  }

  type SubscribeTracksRequestBody = {
    client_id: string
    stream_id: string
    track_id: string
  }

  type BaseResponseBody = {
    code: number
    ok: boolean
    data: object
  }

  type CreateRoomResponseBody = BaseResponseBody & {
    data: {
      id: string
    }
  }

  type GetRoomResponseBody = BaseResponseBody & {
    data: {
      id: string
      name: string
    }
  }

  type RegisterClientResponseBody = BaseResponseBody & {
    data: {
      client_id: string
    }
  }

  type NegotiateConnectionResponseBody = BaseResponseBody & {
    data: {
      answer: RTCSessionDescription
    }
  }
}
