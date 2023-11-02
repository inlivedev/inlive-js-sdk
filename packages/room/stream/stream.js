export const createStream = () => {
  const Stream = class {
    id
    clientId
    name
    origin
    source
    mediaStream
    /** @type {Array<import('../peer/peer-types').RoomPeerType.VoiceActivityCallback>} */
    voiceActivityCallbacks
    audioLevel

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
      this.voiceActivityCallbacks = []
      this.audioLevel = 0
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

    /**
     * Listen for voice activity from stream
     * @param {import('../peer/peer-types.d.ts').RoomPeerType.VoiceActivityCallback} callback
     * @returns {void}
     */
    onVoiceActivity = (callback) => {
      this.voiceActivityCallbacks.push(callback)
    }

    /**
     * @param {import('../peer/peer-types.d.ts').RoomPeerType.VoiceActivity} activity
     * @returns {void}
     */
    addVoiceActivity = (activity) => {
      for (const callback of this.voiceActivityCallbacks) {
        callback(activity)
      }

      if (activity.audio_levels) {
        for (const level of activity.audio_levels) {
          this.audioLevel = level.audio_level
        }
      } else {
        this.audioLevel = 0
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
        audioLevel: 0,
        replaceTrack: stream.replaceTrack,
        onVoiceActivity: stream.onVoiceActivity,
        addVoiceActivity: stream.addVoiceActivity,
      })
    },
  }
}
