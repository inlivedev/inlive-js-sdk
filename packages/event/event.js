/**
 * @typedef {Object<string, Set<Function>>} Events
 */

/**
 * @typedef SubscribeReturn
 * @property {Function} unsubscribe - The unsubscribe function to unsubscribe the callback from the event
 */

/**
 * The event module manages a list of subscribers and is responsible to send an event to the subscribers using pub/sub pattern
 *
 * @example
 * // publish an event
 * event.publish('stream:ice-connection-state-change-event', {
     type: 'stream:ice-connection-state-change-event',
     detail: {
       iceConnectionState: 'connected',
     },
   })
 *
 * // subscribe to an event
 * event.subscribe(
      'stream:ice-connection-state-change-event',
      (data) => {
        // handle the event
      }
   )
 */

/**
 * @typedef EventType
 * @property {Function} subscribe - The subscribe method
 * @property {Function} publish - The publish method
 */

/** @type {EventType} */
const event = (() => {
  /**
   * ======================================================
   *  Variables
   * ======================================================
   */

  /** @type {Events} */
  const events = {}

  /**
   * ======================================================
   *  Functions
   * ======================================================
   */

  /**
   *
   * @param {Events} events - The event object that holds all events and callbacks for each event
   * @param {string} eventName - The name of the event
   * @returns {boolean} - Returns true if the events[eventName] value is instanceOf Set
   */
  const isInstanceOfSet = (events, eventName) =>
    events[eventName] instanceof Set

  /**
   * Publish an event and trigger the callback
   *
   * @param {string} eventName - The name of the event
   * @param {any} data - The actual data sent
   */
  const publish = (eventName = '', data = {}) => {
    if (!eventName) {
      throw new Error('Failed to process - event name is required')
    } else if (typeof eventName !== 'string') {
      throw new TypeError(
        'Failed to process - event name must be in a string format'
      )
    } else if (eventName.trim().length === 0) {
      throw new Error('Failed to process - event name must not be empty')
    }

    if (isInstanceOfSet(events, eventName)) {
      for (const callback of events[eventName]) {
        typeof callback === 'function' && callback(data)
      }
    } else {
      events[eventName] = new Set()
    }
  }

  /**
   * Enable callback function to subscribe to specific event
   *
   * @param {string} eventName - The name of the event
   * @param {Function} callback - A callback function
   * @returns {SubscribeReturn} An object that contains the unsubscribe function
   */
  const subscribe = (eventName, callback) => {
    if (!eventName) {
      throw new Error('Failed to process - event name is required')
    } else if (typeof eventName !== 'string') {
      throw new TypeError(
        'Failed to process - event name must be in a string format'
      )
    } else if (eventName.trim().length === 0) {
      throw new Error('Failed to process - event name must not be empty')
    } else if (typeof callback !== 'function') {
      throw new TypeError(
        'Failed to process - please provide a callback function'
      )
    }

    if (!isInstanceOfSet(events, eventName)) {
      events[eventName] = new Set()
    }
    events[eventName].add(callback)

    /**
     * Enable callback function to unsubscribe from specific event
     */
    const unsubscribe = () => {
      events[eventName].delete(callback)
    }

    return {
      unsubscribe,
    }
  }

  return {
    publish,
    subscribe,
  }
})()

Object.freeze(event)

export { event }
