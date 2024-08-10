export declare namespace ConfigType {
  type VideoConfig = {
    enable: boolean
  }

  type AudioConfig = {
    enable: boolean
    useDTX: boolean
    useInbandFec: boolean
  }

  type PeerConfig = {
    video: VideoConfig
    audio: AudioConfig
  }
}
