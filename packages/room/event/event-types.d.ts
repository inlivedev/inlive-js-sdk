import type { SharedType } from '../../internal/types/types'
import type { createEvent } from './event'

export declare namespace RoomEventType {
  type CreateEvent = typeof createEvent
  type InstanceEvent = ReturnType<ReturnType<CreateEvent>['createInstance']>

  type EventHandlers = Set<(data: SharedType.ObjectLiteral) => void>

  type EventItems = {
    [key: string]: EventHandlers
  }
}
