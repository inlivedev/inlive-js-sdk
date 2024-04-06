import type { createStream } from './stream.js'
import type { createStreams } from './streams.js'

export declare namespace RoomStreamType {
  export type CreateStream = typeof createStream
  export type CreateStreams = typeof createStreams

  export type InstanceStream = ReturnType<
    ReturnType<CreateStream>['createInstance']
  >
  export type InstanceStreams = ReturnType<
    ReturnType<CreateStreams>['createInstance']
  >

  export type StreamParameters = {
    id: string
    clientId: string
    name: string
    origin: 'local' | 'remote'
    source: 'media' | 'screen'
    mediaStream: MediaStream
  }

  export type AddStreamParameters = Omit<StreamParameters, 'id'>

  export type DraftStream = {
    clientId?: string
    name?: string
    origin?: 'local' | 'remote'
    source?: 'media' | 'screen'
    mediaStream?: MediaStream
  }
}
