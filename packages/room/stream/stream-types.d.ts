import { createStream } from './stream'
import { createStreams } from './streams'

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
  origin: 'local' | 'remote'
  source: 'media' | 'screen'
  mediaStream: MediaStream
}

export type AddStreamParameters = Omit<StreamParameters, 'id'>

export type DraftStream = {
  origin?: StreamParameters['origin']
  source?: StreamParameters['source']
  mediaStream?: StreamParameters['mediaStream']
}

export as namespace RoomStreamType
