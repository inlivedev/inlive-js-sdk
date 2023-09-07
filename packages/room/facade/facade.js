import merge from 'lodash-es/merge.js'
import { createFetcher } from '../api/fetcher'
import { createApi } from '../api/api'
import { createEvent } from '../event/event'
import { createStreams } from '../stream/streams'
import { createStream } from '../stream/stream'
import { createPeer, PeerEvents } from '../peer/peer'
import { createChannel, ChannelEvents } from '../channel/channel'
import * as defaultConfig from '../config/config'

const config = {
  api: defaultConfig.api,
  webrtc: defaultConfig.webrtc,
}

/** @param {import('./facade-types').RoomFacadeType.FacadeDependencies} facadeDependencies Dependencies for facade module */
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
     * @param {import('../room-types').RoomType.UserConfig} userConfig
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
        createClient: api.registerClient,
        getRoom: api.getRoom,
        createPeer:
          /**
           * @param {string} roomId
           * @param {string} clientId
           */
          (roomId, clientId) => {
            peer.connect(roomId, clientId)
            return peer
          },
        on: event.on,
        leaveRoom: api.leaveRoom,
        terminateRoom: api.terminateRoom,
        event: {
          CHANNEL_CONNECTED: roomEvents.channel.CHANNEL_CONNECTED,
          CHANNEL_DISCONNECTED: roomEvents.channel.CHANNEL_DISCONNECTED,
          PEER_CONNECTED: roomEvents.peer.PEER_CONNECTED,
          PEER_DISCONNECTED: roomEvents.peer.PEER_DISCONNECTED,
          STREAM_ADDED: roomEvents.peer.STREAM_ADDED,
          STREAM_REMOVED: roomEvents.peer.STREAM_REMOVED,
        },
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
