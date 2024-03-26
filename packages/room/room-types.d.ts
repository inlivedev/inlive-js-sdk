import type { SharedType } from '../internal/types/types.js'
import { api, webrtc, media } from './config/config.js'

export declare namespace RoomType {
  type Config = {
    api: typeof api
    webrtc: typeof webrtc
    media: typeof media
  }

  type UserConfig = {
    api?: SharedType.DeepPartial<typeof api>
    webrtc?: SharedType.DeepPartial<typeof webrtc>
    media?: SharedType.DeepPartial<typeof media>
  }

  type Bitrates = {
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

  type QualityPreset = {
    sid: number
    tid: number
  }

  type QualityPresets = {
    high: QualityPreset
    low: QualityPreset
    mid: QualityPreset
  }

  type Options = {
    bitrates?: Bitrates
    codecs?: string[]
    // empty room timeout in nanoseconds before the room is closed
    emptyRoomTimeoutMS?: number
    pliIntervalMS?: number
    qualityPresets?: QualityPresets
  }

  type Room = {
    id: string
    name: string
    options: Options
  }
}
