import merge from 'lodash-es/merge.js'
import { createFetcher } from '../api/fetcher.js'
import { createApi } from '../api/api.js'
import { createEvent } from '../event/event.js'
import { createStreams } from '../stream/streams.js'
import { createStream } from '../stream/stream.js'
import { createPeer } from '../peer/peer.js'
import { createChannel } from '../channel/channel.js'
import * as defaultConfig from '../config/config.js'

const config = {
  api: defaultConfig.api,
  webrtc: defaultConfig.webrtc,
  media: defaultConfig.media,
}

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
      merge(config, userConfig)

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
           * @param {import('../peer/peer-types.js').RoomPeerType.PeerConfig} [config]
           */
          async (roomId, clientId, config) => {
            await peer.connect(roomId, clientId, config)
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
  config,
  api: { createFetcher, createApi },
  event: { createEvent },
  stream: { createStream, createStreams },
  peer: { createPeer },
  channel: { createChannel },
})
