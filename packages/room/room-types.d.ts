import { api, webrtc, media } from './config/config.js'

export declare namespace RoomType {
  type Config = {
    api: typeof api
    webrtc: typeof webrtc
    media: typeof media
  }

  type UserConfig = {
    api?: Partial<typeof api>
    webrtc?: Partial<typeof webrtc>
    media?: Partial<typeof media>
  }

  type BitrateConfigs = {
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

  type Room = {
    id: string
    name: string
    codecPreferences: string[]
    bitrateConfigs: BitrateConfigs
  }
}
