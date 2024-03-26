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
}
