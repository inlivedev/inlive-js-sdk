import type { createFetcher } from './fetcher'
import type { createApi } from './api'

export type CreateFetcher = typeof createFetcher
export type CreateApi = typeof createApi

export type InstanceFetcher = ReturnType<
  ReturnType<CreateFetcher>['createInstance']
>
export type InstanceApi = ReturnType<ReturnType<CreateApi>['createInstance']>

export type ApiDependencies = {
  fetcher: RoomAPIType.InstanceFetcher
}

export type TrackSourcesRequestBody = {
  track_id: string
  source: string
}

export type SubscribeTracksRequestBody = {
  client_id: string
  stream_id: string
  track_id: string
}

export type BaseResponseBody = {
  code: number
  ok: boolean
  data: any
}

export type CreateRoomResponseBody = BaseResponseBody & {
  data: {
    id: string
  }
}

export type GetRoomResponseBody = BaseResponseBody & {
  data: {
    id: string
    name: string
  }
}

export type RegisterClientResponseBody = BaseResponseBody & {
  data: {
    client_id: string
  }
}

export type NegotiateConnectionResponseBody = BaseResponseBody & {
  data: {
    answer: RTCSessionDescription
  }
}

export as namespace RoomAPIType
