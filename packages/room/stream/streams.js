export const createStreams = () => {
  const Streams = class {
    _streams
    _drafts

    constructor() {
      /**
       * To trigger the type safety
       * @augments {Map<string, RoomStreamType.InstanceStream>}
       */
      // eslint-disable-next-line prettier/prettier
      class StreamsMap extends Map { }
      this._streams = new StreamsMap()

      /**
       * To trigger the type safety
       * @augments {Map<string, RoomStreamType.DraftStream>}
       */
      // eslint-disable-next-line prettier/prettier
      class DraftStreamsMap extends Map { }
      this._drafts = new DraftStreamsMap()
    }

    /**
     * Add a new stream
     * @param {string} key
     * @param {RoomStreamType.InstanceStream} stream
     * @returns {RoomStreamType.InstanceStream | null} Returns the added stream data
     */
    addStream = (key, stream) => {
      this._streams.set(key, stream)
      return this._streams.get(key) || null
    }

    /**
     * Remove a stream
     * @param {string} key
     * @returns {RoomStreamType.InstanceStream | null} Returns the deleted stream data for the last time
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
     * @returns {RoomStreamType.InstanceStream | null} Returns the stream data if the data exists
     */
    getStream = (key) => {
      return this._streams.get(key) || null
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
     * @param {RoomStreamType.DraftStream} value
     */
    addDraft = (key, value = {}) => {
      this.validateKey(key)

      const draft = this._drafts.get(key) || {}

      this._drafts.set(key, {
        origin: value.origin || draft.origin || undefined,
        source: value.source || draft.source || undefined,
        mediaStream: value.mediaStream || draft.mediaStream || undefined,
      })
    }

    /**
     * Get the draft stream data
     * @param {string} key
     * @returns {RoomStreamType.DraftStream | null}
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
     * @param {RoomStreamType.AddStreamParameters} data
     * @throws {Error}
     * @returns {boolean}
     */
    validateStream = (data) => {
      if (
        !data ||
        !(data.mediaStream instanceof MediaStream) ||
        typeof data.origin !== 'string' ||
        typeof data.source !== 'string'
      ) {
        throw new Error(
          'Please provide valid stream origin, source, and MediaStream data'
        )
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
