import mergeWith from 'lodash-es/mergeWith.js'
import { createFetcher } from './api/fetcher.js'
import { createApi } from './api/api.js'
import { createEvent } from './event/event.js'
import { createStreams } from './stream/streams.js'
import { createStream } from './stream/stream.js'
import { createPeer } from './peer/peer.js'
import { createChannel } from './channel/channel.js'
import * as config from './config/config.js'
import { createAccessToken } from './api/access-token.js'
export { createAccessToken } from './api/access-token.js'
export { REASONS as ChannelClosureReasons } from './channel/channel.js'

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
 * @param {import('./room-types.js').RoomType.UserConfig} [userConfig]
 */
export const Room = (userConfig = config) => {
  mergeWith(config, userConfig, (_, userValue) => {
    return Array.isArray(userValue) ? userValue : undefined
  })

  const hubBaseUrl = `${config.api.baseUrl}/${config.api.version}`
  let accessToken = null

  if (config.api.apiKey.trim().length > 0) {
    accessToken = createAccessToken({
      apiKey: config.api.apiKey,
    })
  }

  const fetcher = createFetcher().createInstance(hubBaseUrl)
  const api = createApi({
    fetcher,
    accessToken,
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
    setAccessToken: api.setAccessToken,
    on: event.on,
    leaveRoom: api.leaveRoom,
    endRoom: api.endRoom,
  }
}
