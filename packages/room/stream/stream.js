export const createStream = () => {
  const Stream = class extends EventTarget {
    id
    clientId
    name
    origin
    source
    mediaStream
    audioLevel

    /**
     * @param {import('./stream-types.js').RoomStreamType.StreamParameters} streamParameters
     */
    constructor({ id, clientId, name, origin, source, mediaStream }) {
      super()
      this.id = id
      this.clientId = clientId
      this.name = name
      this.origin = origin
      this.source = source
      this.mediaStream = mediaStream
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
     * @param {import('../peer/peer-types.d.ts').RoomPeerType.VoiceActivity} activity
     * @returns {void}
     */
    addVoiceActivity = (activity) => {
      if (activity.audio_levels) {
        for (const level of activity.audio_levels) {
          this.audioLevel = level.audio_level
          this.#triggerVoiceActivityEvent()
        }
      } else {
        this.audioLevel = 0
        this.#triggerVoiceActivityEvent()
      }
    }

    #triggerVoiceActivityEvent = () => {
      const event = new CustomEvent('voiceactivity', {
        detail: {
          audioLevel: this.audioLevel,
        },
      })

      this.dispatchEvent(event)
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
        addVoiceActivity: stream.addVoiceActivity,
      })
    },
  }
}
