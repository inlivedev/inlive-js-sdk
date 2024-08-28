import mergeWith from 'lodash-es/mergeWith.js'
import { createFetcher } from './api/fetcher.js'
import { createApi } from './api/api.js'
import { createEvent } from './event/event.js'
import { createStreams } from './stream/streams.js'
import { createStream } from './stream/stream.js'
import { createPeer } from './peer/peer.js'
import { createChannel } from './channel/channel.js'
import * as config from './config/config.js'
export { createAuth } from './api/auth.js'
export { REASONS as ChannelClosureReasons } from './channel/channel.js'

/**
 * @param {import('./room-types.js').RoomType.UserConfig} [userConfig]
 */
export const Room = (userConfig = config) => {
  mergeWith(config, userConfig, (_, userValue) => {
    return Array.isArray(userValue) ? userValue : undefined
  })

  const hubBaseUrl = `${config.api.baseUrl}/${config.api.version}`

  const fetcher = createFetcher().createInstance(hubBaseUrl)
  const api = createApi({
    fetcher,
    config,
  }).createInstance()
  const event = createEvent().createInstance()
  const streams = createStreams().createInstance()
  const peer = createPeer({
    api,
    config,
    createStream,
    event,
    streams,
  }).createInstance()
  createChannel({
    api,
    event,
    peer,
    streams,
  }).createInstance(hubBaseUrl)

  return {
    createRoom: api.createRoom,
    getRoom: api.getRoom,
    createClient: api.registerClient,
    getClient: api.getClient,
    setClientName: api.setClientName,
    getMetadata: api.getMetadata,
    setMetadata: api.setMetadata,
    deleteMetadata: api.deleteMetadata,
    createPeer:
      /**
       * @param {string} roomId
       * @param {string} clientId
       */
      async (roomId, clientId) => {
        await peer.connect(roomId, clientId)
        return peer
      },
    createDataChannel: api.createDataChannel,
    setAuth: api.setAuth,
    on: event.on,
    addEventListener: event.addEventListener,
    removeEventListener: event.removeEventListener,
    leaveRoom: api.leaveRoom,
    endRoom: api.endRoom,
  }
}
