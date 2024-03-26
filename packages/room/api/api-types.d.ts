import type { createFetcher } from './fetcher.js'
import type { createApi } from './api.js'
import { RoomType } from '../room-types.js'

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

  type RegisterClientRequestBody = {
    uid?: string
    name?: string
    enable_vad?: boolean
  }

  type Bitrates = {
    audio: number
    audio_red: number
    video: number
    video_high: number
    video_high_pixels: number
    video_mid: number
    video_mid_pixels: number
    video_low: number
    video_low_pixels: number
    initial_bandwidth: number
  }

  type Options = {
    bitrates: Bitrates
    codecs: string[]
    // empty room timeout in nanoseconds before the room is closed
    empty_Room_timeout_ns: number
    pli_interval_ns: number
    quality_presets: RoomType.QualityPresets
  }

  type RoomRequest = {
    id: string
    name: string
    options?: Options
  }

  type RoomResponse = {
    id: string
    name: string
    options: Options
  }

  type BaseResponseBody = {
    code: number
    ok: boolean
    message: string
  }

  type RoomCreateBody = BaseResponseBody & {
    data: RoomRequest
  }

  type RoomRespBody = BaseResponseBody & {
    data: RoomResponse
  }

  type RoomReturnBody = BaseResponseBody & {
    data: RoomType.Room
  }

  type RegisterClientResponseBody = BaseResponseBody & {
    data: {
      client_id: string
      name: string
      bitrates: Bitrates
    }
  }

  type GetClientResponseBody = BaseResponseBody & {
    data: {
      id: string
      name: string
      peer_connection_state: RTCPeerConnectionState
      ice_peer_connection_state: RTCIceConnectionState
      events: {
        [key: string]: {
          name: string
          timestamp: number
          data: { [key: string]: string | null }
        }
      }
    }
  }

  type SetClientNameResponse = BaseResponseBody & {
    data: {
      client_id: string
      name: string
      bitrates: Bitrates
    }
  }

  type GetMetadataResponse = BaseResponseBody & {
    data: any
  }

  type NegotiateConnectionResponseBody = BaseResponseBody & {
    data: {
      answer: RTCSessionDescription
    }
  }
}
