import { facade } from './facade/facade.js'

export const RoomEvent = Object.freeze({
  CHANNEL_OPENED: 'channelOpened',
  CHANNEL_CLOSED: 'channelClosed',
  PEER_OPENED: 'peerOpened',
  PEER_CLOSED: 'peerClosed',
  STREAM_AVAILABLE: 'streamAvailable',
  STREAM_REMOVED: 'streamRemoved',
  META_CHANGED: 'metaChanged',
})

/**
 * @typedef {ReturnType<import('./facade/facade-types.js').RoomFacadeType.CreateInstanceFacade>} RoomInstance
 */

/**
 * @param {import('./facade/facade-types.js').RoomFacadeType.Facade} facade Object which creates an instance Facade module
 * @returns {(config?: import('./room-types.js').RoomType.UserConfig) => RoomInstance}
 */
const createRoom = (facade) => {
  return (config = {}) => {
    return facade.createInstance(config)
  }
}

export const Room = createRoom(facade)
