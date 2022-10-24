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
   */
  const getUserMedia = async (mediaConstraints = {}) => {
    const userMedia = await navigator.mediaDevices.getUserMedia({
      video: defaultMediaConstraints.video,
      audio: defaultMediaConstraints.audio,
      ...mediaConstraints,
    })

    return userMedia
  }

  /**
   *
   * @param {HTMLVideoElement} videoElement - The HTML Video Element
   * @param {MediaStream} mediaStream - The media stream object
   * @returns {HTMLVideoElement} Returns the HTML video element
   */
  const attachMediaElement = (videoElement, mediaStream) => {
    if (videoElement instanceof HTMLVideoElement) {
      videoElement.srcObject = mediaStream
      videoElement.autoplay = true
      videoElement.muted = true
      videoElement.playsInline = true
      videoElement.controls = false

      return videoElement
    } else {
      throw new TypeError('Failed to process - input must be a video element')
    }
  }

  return {
    attachMediaElement,
    getUserMedia,
  }
})()

Object.freeze(media)

export { media }
