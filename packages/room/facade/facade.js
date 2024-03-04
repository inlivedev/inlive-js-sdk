import mergeWith from 'lodash-es/mergeWith.js'
import { createFetcher } from '../api/fetcher.js'
import { createApi } from '../api/api.js'
import { createEvent } from '../event/event.js'
import { createStreams } from '../stream/streams.js'
import { createStream } from '../stream/stream.js'
import { createPeer } from '../peer/peer.js'
import { createChannel } from '../channel/channel.js'
import * as config from '../config/config.js'

/** @param {import('./facade-types.js').RoomFacadeType.FacadeDependencies} facadeDependencies Dependencies for facade module */
export const createFacade = ({
  config,
  api: { createFetcher, createApi },
  event: { createEvent },
  stream: { createStream, createStreams },
  peer: { createPeer },
  channel: { createChannel },
}) => {
  return {
    /**
     * @param {import('../room-types.js').RoomType.UserConfig} userConfig
     */
    createInstance: (userConfig) => {
      mergeWith(config, userConfig, (_, userValue) => {
        return Array.isArray(userValue) ? userValue : undefined
      })

      const baseUrl = `${config.api.baseUrl}/${config.api.version}`
      const apiKey = config.api.apiKey
      const fetcher = createFetcher().createInstance(baseUrl, apiKey)
      const api = createApi({
        fetcher,
      }).createInstance()
      const event = createEvent().createInstance()
      const streams = createStreams().createInstance()
      const peer = createPeer({
        api,
        config: config,
        createStream,
        event,
        streams,
      }).createInstance()
      createChannel({
        api,
        event,
        peer,
        streams,
      }).createInstance(baseUrl)

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
        on: event.on,
        leaveRoom: api.leaveRoom,
        endRoom: api.endRoom,
      }
    },
  }
}

export const facade = createFacade({
  config: config,
  api: { createFetcher, createApi },
  event: { createEvent },
  stream: { createStream, createStreams },
  peer: { createPeer },
  channel: { createChannel },
})
