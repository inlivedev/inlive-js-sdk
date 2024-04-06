export const createStreams = () => {
  const Streams = class {
    _streams
    _drafts

    constructor() {
      /**
       * To trigger the type safety
       * @augments {Map<string, import('./stream-types.js').RoomStreamType.InstanceStream>}
       */
      class StreamsMap extends Map {}
      this._streams = new StreamsMap()

      /**
       * To trigger the type safety
       * @augments {Map<string, import('./stream-types.js').RoomStreamType.DraftStream>}
       */
      class DraftStreamsMap extends Map {}
      this._drafts = new DraftStreamsMap()
    }

    /**
     * Add a new stream
     * @param {string} key
     * @param {import('./stream-types.js').RoomStreamType.InstanceStream} stream
     * @returns {import('./stream-types.js').RoomStreamType.InstanceStream} Returns the added stream data
     */
    addStream = (key, stream) => {
      this._streams.set(key, stream)
      return stream
    }

    /**
     * Remove a stream
     * @param {string} key
     * @returns {import('./stream-types.js').RoomStreamType.InstanceStream | null} Returns the deleted stream data for the last time
     */
    removeStream = (key) => {
      const stream = this._streams.get(key) || null
      this._streams.delete(key)
      return stream
    }

    /**
     * Get all stored streams
     */
    getAllStreams = () => {
      return [...this._streams.values()]
    }

    /**
     * Get a specific stream
     * @param {string} key
     * @returns {import('./stream-types.js').RoomStreamType.InstanceStream | null} Returns the stream data if the data exists
     */
    getStream = (key) => {
      return this._streams.get(key) || null
    }

    /**
     * @param {string} trackId
     * @returns {import('./stream-types.js').RoomStreamType.InstanceStream | null} Returns the stream data if the stream track id matches with the one given on parameter
     */
    getStreamByTrackId = (trackId) => {
      const stream = this.getAllStreams().find((stream) => {
        return !!stream.mediaStream.getTrackById(trackId)
      })

      return stream || null
    }

    /**
     * Get a total number of stored streams
     * @returns {number}
     */
    getTotalStreams = () => {
      return this._streams.size
    }

    /**
     * Check if a specific stream has already stored
     * @param {string} key
     * @returns {boolean}
     */
    hasStream = (key) => {
      return this._streams.has(key)
    }

    /**
     * Add a new draft stream data
     * @param {string} key
     * @param {import('./stream-types.js').RoomStreamType.DraftStream} value
     */
    addDraft = (key, value = {}) => {
      this.validateKey(key)

      const draft = this._drafts.get(key) || {}

      this._drafts.set(key, {
        clientId: value.clientId || draft.clientId || '',
        name: value.name || draft.name || '',
        origin: value.origin || draft.origin || '',
        source: value.source || draft.source || '',
        mediaStream: value.mediaStream || draft.mediaStream || undefined,
      })
    }

    /**
     * Get the draft stream data
     * @param {string} key
     * @returns {import('./stream-types.js').RoomStreamType.DraftStream | null}
     */
    getDraft = (key) => {
      this.validateKey(key)
      return this._drafts.get(key) || null
    }

    /**
     * Remove the draft stream data
     * @param {string} key
     * @returns {boolean}
     */
    removeDraft = (key) => {
      this.validateKey(key)
      return this._drafts.delete(key)
    }

    /**
     * Validate the streams map key
     * @param {string} key
     * @throws {Error}
     * @returns {boolean}
     */
    validateKey = (key) => {
      if (key.trim().length === 0) {
        throw new Error('Please provide valid string key')
      }

      return true
    }

    /**
     * Validate the streams data
     * @param {import('./stream-types.js').RoomStreamType.DraftStream} data
     * @returns {boolean}
     */
    validateStream = (data) => {
      if (!data || !(data.mediaStream instanceof MediaStream)) {
        return false
      }

      if (
        typeof data.clientId !== 'string' ||
        data.clientId.trim().length === 0
      ) {
        return false
      }

      if (typeof data.name !== 'string') {
        return false
      }

      if (typeof data.origin !== 'string' || data.origin.trim().length === 0) {
        return false
      }

      if (typeof data.source !== 'string' || data.source.trim().length === 0) {
        return false
      }

      return true
    }
  }

  return {
    createInstance: () => {
      const streams = new Streams()

      return {
        addStream: streams.addStream,
        removeStream: streams.removeStream,
        getAllStreams: streams.getAllStreams,
        getStream: streams.getStream,
        getStreamByTrackId: streams.getStreamByTrackId,
        getTotalStreams: streams.getTotalStreams,
        hasStream: streams.hasStream,
        addDraft: streams.addDraft,
        getDraft: streams.getDraft,
        removeDraft: streams.removeDraft,
        validateKey: streams.validateKey,
        validateStream: streams.validateStream,
      }
    },
  }
}
