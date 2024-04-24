export const createStream = () => {
  const Stream = class extends EventTarget {
    id
    clientId
    name
    origin
    source
    mediaStream
    audioLevel
    lastVoiceActivity

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
      this.lastVoiceActivity = 0
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
      if (activity.audioLevels) {
        for (const level of activity.audioLevels) {
          this.audioLevel = level.audioLevel
          this.#triggerVoiceActivityEvent(this.audioLevel)
          this.lastVoiceActivity = Date.now()
        }
      } else {
        this.audioLevel = 0
        this.#triggerVoiceActivityEvent(this.audioLevel)
      }
    }

    /**
     * @param audioLevel {number}
     * @returns {void}
     */

    #triggerVoiceActivityEvent = (audioLevel) => {
      const event = new CustomEvent('voiceactivity', {
        detail: {
          audioLevel: audioLevel,
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

      return stream
    },
  }
}
