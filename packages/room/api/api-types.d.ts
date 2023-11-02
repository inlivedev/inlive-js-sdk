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

  type RegisterClientRequestBody = {
    uid?: string
    name?: string
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

  type BaseResponseBody = {
    code: number
    ok: boolean
    message: string
  }

  type CreateRoomResponseBody = BaseResponseBody & {
    data: {
      room_id: string
      name: string
      bitrates_config: Bitrates
    }
  }

  type GetRoomResponseBody = BaseResponseBody & {
    data: {
      room_id: string
      name: string
      bitrates_config: Bitrates
    }
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

  type NegotiateConnectionResponseBody = BaseResponseBody & {
    data: {
      answer: RTCSessionDescription
    }
  }
}
