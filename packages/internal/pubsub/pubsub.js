/**
 * @typedef {Object<string, Set<Function>>} Events
 */

/**
 * @typedef SubscribeReturn
 * @property {Function} unsubscribe - The unsubscribe function to unsubscribe the callback from the event
 */

/**
 * The publisher / subscriber module manages a list of subscribers and is responsible to send an event to the subscribers
 *
 * @example
 * // publish an event
 * pubsub.publish('stream:ice-connection-state-change', {
     type: 'stream:ice-connection-state-change',
     detail: {
       iceConnectionState: 'connected',
     },
   })
 *
 * // subscribe to an event
 * pubsub.subscribe(
      'stream:ice-connection-state-change',
      (data) => {
        // handle the event
      }
   )
 */
const pubsub = (() => {
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
  const publish = (eventName, data) => {
    if (isInstanceOfSet(events, eventName)) {
      for (const callback of events[eventName]) {
        callback(data)
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

Object.freeze(pubsub)

export { pubsub }
