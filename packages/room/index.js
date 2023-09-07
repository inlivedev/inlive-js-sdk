import { facade } from './facade/facade.js'

/**
 * @typedef {ReturnType<import('./facade/facade-types').RoomFacadeType.CreateInstanceFacade>} RoomInstance
 */

/**
 * @param {import('./facade/facade-types').RoomFacadeType.Facade} facade Object which creates an instance Facade module
 * @returns {(config?: import('./room-types').RoomType.UserConfig) => RoomInstance}
 */
const createRoom = (facade) => {
  return (config = {}) => {
    return facade.createInstance(config)
  }
}

export const Room = createRoom(facade)
