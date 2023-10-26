export const createStream = () => {
  const Stream = class {
    id
    clientId
    name
    origin
    source
    mediaStream

    /**
     * @param {import('./stream-types.js').RoomStreamType.StreamParameters} streamParameters
     */
    constructor({ id, clientId, name, origin, source, mediaStream }) {
      this.id = id
      this.clientId = clientId
      this.name = name
      this.origin = origin
      this.source = source
      this.mediaStream = mediaStream
    }

    /**
     * @param {MediaStreamTrack} newTrack
     */
    replaceTrack = (newTrack) => {
      if (!(newTrack instanceof MediaStreamTrack)) {
        throw new TypeError('The track must be an instance of MediaStreamTrack')
      }

      const currentTrack = this.mediaStream.getTracks().find((currentTrack) => {
        return currentTrack.kind === newTrack.kind
      })

      if (currentTrack) {
        this.mediaStream.removeTrack(currentTrack)
        this.mediaStream.addTrack(newTrack)
      }
    }
  }

  return {
    /**
     * @param {import('./stream-types.js').RoomStreamType.StreamParameters} data
     */
    createInstance: (data) => {
      const stream = new Stream(data)

      return Object.freeze({
        id: stream.id,
        clientId: stream.clientId,
        name: stream.name,
        origin: stream.origin,
        source: stream.source,
        mediaStream: stream.mediaStream,
        replaceTrack: stream.replaceTrack,
      })
    },
  }
}
