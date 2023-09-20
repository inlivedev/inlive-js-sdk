export const createStream = () => {
  const Stream = class {
    id
    origin
    source
    mediaStream

    /**
     * @param {import('./stream-types.js').RoomStreamType.StreamParameters} streamParameters
     */
    constructor({ id, origin, source, mediaStream }) {
      this.id = id
      this.origin = origin
      this.source = source
      this.mediaStream = mediaStream
    }

    /**
     * @param {MediaStreamTrack} newTrack
     */
    replaceTrack = (newTrack) => {
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
        origin: stream.origin,
        source: stream.source,
        mediaStream: stream.mediaStream,
        replaceTrack: stream.replaceTrack,
      })
    },
  }
}
