export const InternalPeerEvents = {
  INTERNAL_DATACHANNEL_AVAILABLE: 'internalDataChannelAvailable',
  REMOTE_STREAM_READY_TO_ADD: 'remoteStreamReadyToAdd',
}

export const RoomEvent = Object.freeze({
  CHANNEL_OPENED: 'channelOpened',
  CHANNEL_CLOSED: 'channelClosed',
  PEER_OPENED: 'peerOpened',
  PEER_CLOSED: 'peerClosed',
  STREAM_AVAILABLE: 'streamAvailable',
  STREAM_REMOVED: 'streamRemoved',
  META_CHANGED: 'metaChanged',
})
