import merge from 'lodash-es/merge.js'
import { createFetcher } from '../api/fetcher.js'
import { createApi } from '../api/api.js'
import { createEvent } from '../event/event.js'
import { createStreams } from '../stream/streams.js'
import { createStream } from '../stream/stream.js'
import { createPeer, PeerEvents } from '../peer/peer.js'
import { createChannel, ChannelEvents } from '../channel/channel.js'
import * as defaultConfig from '../config/config.js'

const config = {
  api: defaultConfig.api,
  webrtc: defaultConfig.webrtc,
}

/** @param {import('./facade-types.js').RoomFacadeType.FacadeDependencies} facadeDependencies Dependencies for facade module */
export const createFacade = ({
  config,
  api: { createFetcher, createApi },
  event: { createEvent },
  stream: { createStream, createStreams },
  peer: { createPeer },
  channel: { createChannel },
  roomEvents,
}) => {
  return {
    /**
     * @param {import('../room-types.js').RoomType.UserConfig} userConfig
     */
    createInstance: (userConfig) => {
      merge(config, userConfig)

      const baseUrl = `${config.api.baseUrl}/${config.api.version}`
      const fetcher = createFetcher().createInstance(baseUrl)
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
        setClientName: api.setClientName,
        createPeer:
          /**
           * @param {string} roomId
           * @param {string} clientId
           */
          async (roomId, clientId) => {
            return await peer.connect(roomId, clientId)
          },
        createDataChannel: api.createDataChannel,
        on: event.on,
        leaveRoom: api.leaveRoom,
        endRoom: api.endRoom,
        event: Object.freeze({
          CHANNEL_CONNECTED: roomEvents.channel.CHANNEL_CONNECTED,
          CHANNEL_DISCONNECTED: roomEvents.channel.CHANNEL_DISCONNECTED,
          PEER_CONNECTED: roomEvents.peer.PEER_CONNECTED,
          PEER_DISCONNECTED: roomEvents.peer.PEER_DISCONNECTED,
          STREAM_AVAILABLE: roomEvents.peer.STREAM_AVAILABLE,
          STREAM_REMOVED: roomEvents.peer.STREAM_REMOVED,
        }),
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
  roomEvents: {
    peer: PeerEvents,
    channel: ChannelEvents,
  },
})
