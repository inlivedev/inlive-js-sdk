export declare namespace RoomType {
  type Config = {
    api: {
      baseUrl: string
      version: string
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
    }
    webrtc?: {
      iceServers?: RTCIceServer[]
    }
  }
}
