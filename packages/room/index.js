import { facade } from './facade/facade.js'

/**
 * @typedef {ReturnType<RoomFacadeType.CreateInstanceFacade>} RoomInstance
 */

/**
 * @param {RoomFacadeType.Facade} facade Object which creates an instance Facade module
 * @returns {(config?: RoomType.UserConfig) => RoomInstance}
 */
const createRoom = (facade) => {
  return (config = {}) => {
    return facade.createInstance(config)
  }
}

export const Room = createRoom(facade)
