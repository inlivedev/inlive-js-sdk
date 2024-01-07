export declare namespace RoomType {
  type Config = {
    api: {
      baseUrl: string
      version: string
      apiKey: string
    }
    webrtc: {
      iceServers: RTCIceServer[]
    }

    media: {
      video: {
        width: number
        height: number
        frameRate: number
        facingMode: string
        aspectRatio: number
        maxBitrate: number
        codec: string
      }
      audio: {
        echoCancellation: boolean
        noiseSuppression: boolean
        autoGainControl: boolean
        red: boolean
      }
    }
  }

  type UserConfig = {
    api?: {
      baseUrl?: string
      version?: string
      apiKey?: string
    }
    webrtc?: {
      iceServers?: RTCIceServer[]
    }
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
