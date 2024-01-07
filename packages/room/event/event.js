export const createEvent = () => {
  const Event = class {
    /** @type {import('./event-types.js').RoomEventType.EventItems} */
    _events

    constructor() {
      this._events = {}
    }

    /**
     * @param {string} eventName - The name of the event
     * @param {any} [value] - The actual value sent
     */
    emit = (eventName, value = {}) => {
      if (typeof eventName !== 'string' || eventName.trim().length === 0) {
        throw new Error('Valid string for event name is required')
      }

      const data =
        typeof value === 'object' && value !== null && !Array.isArray(value)
          ? value
          : { data: value }

      const event = this._events[eventName]

      if (event instanceof Set) {
        for (const callback of event) {
          typeof callback === 'function' && callback(data)
        }
      }
    }

    /**
     * @param {string} eventName - The name of the event
     * @param {(data: any) => void} callback - A callback function
     */
    on = (eventName, callback) => {
      if (typeof eventName !== 'string' || eventName.trim().length === 0) {
        throw new Error('Valid string for event name is required')
      }

      if (typeof callback !== 'function') {
        throw new TypeError('Valid callback function is required')
      }

      const event = this._events[eventName]

      if (!(event instanceof Set)) {
        this._events[eventName] = new Set()
      }

      this._events[eventName].add(callback)
    }
  }

  return {
    createInstance: () => {
      const event = new Event()

      return {
        emit: event.emit,
        on: event.on,
      }
    },
  }
}
