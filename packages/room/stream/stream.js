export const createStream = () => {
  const Stream = class {
    id
    origin
    source
    mediaStream

    /**
     * @param {RoomStreamType.StreamParameters} streamParameters
     */
    constructor({ id, origin, source, mediaStream }) {
      this.id = id
      this.origin = origin
      this.source = source
      this.mediaStream = mediaStream
    }
  }

  return {
    /**
     * @param {RoomStreamType.StreamParameters} data
     */
    createInstance: (data) => {
      const stream = new Stream(data)

      return Object.freeze({
        id: stream.id,
        origin: stream.origin,
        source: stream.source,
        mediaStream: stream.mediaStream,
      })
    },
  }
}
