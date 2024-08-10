import { VideoObserver } from './video-observer'

export declare namespace VideoObserver {
  interface StringMapTimeout {
    [key: string]: ReturnType<typeof setTimeout?>
  }
}
