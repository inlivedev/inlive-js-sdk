import type { createFetcher } from './fetcher.js'
import type { createApi } from './api.js'
import type { createAccessToken } from './access-token.js'
import type { SharedType } from '../../internal/types/types.js'

export declare namespace RoomAPIType {
  type CreateFetcher = typeof createFetcher
  type CreateAccessToken = typeof createAccessToken
  type CreateApi = typeof createApi

  type InstanceFetcher = ReturnType<ReturnType<CreateFetcher>['createInstance']>
  type InstanceCreateAccessToken = ReturnType<CreateAccessToken>
  type InstanceApi = ReturnType<ReturnType<CreateApi>['createInstance']>

  type ApiDependencies = {
    fetcher: InstanceFetcher
    accessToken: InstanceCreateAccessToken | null
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

  type BitratesCamelCase = {
    audioRed: number
    audio: number
    video: number
    videoHigh: number
    videoHighPixels: number
    videoMid: number
    videoMidPixels: number
    videoLow: number
    videoLowPixels: number
    initialBandwidth: number
  }

  type BitratesSnakeCase = {
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

  type QualityPreset = {
    sid: number
    tid: number
  }

  type QualityPresets = {
    high: QualityPreset
    low: QualityPreset
    mid: QualityPreset
  }

  type RoomOptions = {
    bitrates: BitratesCamelCase
    codecs: string[]
    emptyRoomTimeoutMS: number
    pliIntervalMS: number
    qualityPresets: QualityPresets
  }

  type RoomUserOptions = SharedType.DeepPartial<RoomOptions>

  type RoomResponse = {
    id: string
    name: string
    options: {
      bitrates: BitratesSnakeCase
      codecs: string[]
      empty_room_timeout_ns: number
      pli_interval_ns: number
      quality_presets: QualityPresets
    }
  }

  type BaseResponseBody = {
    code: number
    ok: boolean
    message: string
  }

  type RoomResponseBody = BaseResponseBody & {
    data: RoomResponse
  }

  type Room = {
    id: string
    name: string
    options: RoomOptions
  }

  type RoomReturnBody = BaseResponseBody & {
    data: Room
  }

  type RegisterClientResponseBody = BaseResponseBody & {
    data: {
      client_id: string
      name: string
      bitrates: BitratesSnakeCase
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
      bitrates: BitratesSnakeCase
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
