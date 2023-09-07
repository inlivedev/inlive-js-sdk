import type { SharedType } from '../../internal/types/types.js'
import type { createEvent } from './event.js'

export declare namespace RoomEventType {
  type CreateEvent = typeof createEvent
  type InstanceEvent = ReturnType<ReturnType<CreateEvent>['createInstance']>

  type EventHandlers = Set<(data: SharedType.ObjectLiteral) => void>

  type EventItems = {
    [key: string]: EventHandlers
  }
}
