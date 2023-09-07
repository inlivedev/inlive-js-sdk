import { facade } from './facade/facade.js'

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
