/* media constructor */
class Media {
  /**
   *
   * @param {MediaStream} localStream - a media stream from getUserMedia()
   */
  constructor(localStream) {
    /**
     * The media stream
     *
     * @type {MediaStream}
     * @public
     */
    this.stream = localStream
  }

  /**
   * Attach media stream to video element
   *
   * @param {HTMLVideoElement} videoElement - a video element to attach the media stream
   */
  attachTo(videoElement) {
    if (videoElement instanceof HTMLVideoElement) {
      videoElement.srcObject = this.stream
      videoElement.autoplay = true
      videoElement.muted = true
      videoElement.playsInline = true
      videoElement.controls = false
    } else {
      throw new TypeError('Failed to process - input must be a video element')
    }
  }
}

const media = (() => {
  /** @type {MediaStreamConstraints} */
  const defaultMediaConstraints = {
    video: {
      frameRate: 30,
      width: { min: 640, ideal: 1280, max: 1280 },
      height: { min: 360, ideal: 720, max: 720 },
    },
    audio: true,
  }

  /**
   *
   * @param {MediaStreamConstraints} mediaConstraints - The media stream constraints
   * @returns {Promise<Media>} - Return a promise resolve to Media instance
   */
  const getUserMedia = async (mediaConstraints = {}) => {
    const userMedia = await navigator.mediaDevices.getUserMedia({
      video: defaultMediaConstraints.video,
      audio: defaultMediaConstraints.audio,
      ...mediaConstraints,
    })

    return new Media(userMedia)
  }

  return {
    getUserMedia,
  }
})()

Object.freeze(media)

export { media }
