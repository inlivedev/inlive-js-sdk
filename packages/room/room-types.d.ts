export declare namespace RoomType {
  type Config = {
    api: {
      baseUrl: string
      version: string
    }
    webrtc: {
      iceServers: RTCIceServer[]
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
