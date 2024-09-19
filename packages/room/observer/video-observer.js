/**
 * Video observer class.
 */
export class VideoObserver {
  #dataChannel
  #resizeObserver
  #intersectionObserver
  /**
   * Constructor.
   * @param {RTCDataChannel} dataChannel - Data channel to use for reporting video size
   */
  constructor(dataChannel) {
    this.#dataChannel = dataChannel
    this.#resizeObserver = new ResizeObserver(this.#onResize.bind(this))
    this.#intersectionObserver = new IntersectionObserver(
      this.#onIntersection.bind(this)
    )
  }

  /**
   * Callback when video element is resized.
   * @param {ResizeObserverEntry[]} entries - Resize observer entries
   * @returns {void}
   */
  #onResize(entries) {
    for (const entry of entries) {
      if (entry.contentBoxSize) {
        if (!(entry.target instanceof HTMLVideoElement)) continue
        if (!(entry.target.srcObject instanceof MediaStream)) continue

        const videoTracks = entry.target.srcObject.getVideoTracks()
        if (videoTracks.length > 0) {
          const trackid = videoTracks[0].id
          const contentBoxSize = entry.contentBoxSize[0]
          const width = contentBoxSize.inlineSize
          const height = contentBoxSize.blockSize
          this.#onVideoSizeChanged(trackid, width, height)
        }
      }
    }
  }

  /**
   * Callback when video element is intersected.
   * @param {IntersectionObserverEntry[]} entries - Intersection observer entries
   * @returns {void}
   */
  #onIntersection(entries) {
    for (const entry of entries) {
      if (!(entry.target instanceof HTMLVideoElement)) continue
      if (!(entry.target.srcObject instanceof MediaStream)) continue

      const videoTracks = entry.target.srcObject.getVideoTracks()
      if (videoTracks.length > 0) {
        const trackid = videoTracks[0].id
        const width = entry.isIntersecting ? entry.target.offsetWidth : 0
        const height = entry.isIntersecting ? entry.target.offsetHeight : 0
        this.#onVideoSizeChanged(trackid, width, height)
      }
    }
  }

  /**
   * Observe video element for any visibility or resize changes.
   * @param {HTMLVideoElement} videoElement - Video element to watch
   * @returns {void}
   */
  observe(videoElement) {
    this.#intersectionObserver.observe(videoElement)
    this.#resizeObserver.observe(videoElement)
  }

  /**
   * Remove observer from video element.
   * @param {HTMLVideoElement} videoElement - Video element to watch
   * @returns {void}
   */
  unobserve(videoElement) {
    this.#intersectionObserver.unobserve(videoElement)
    this.#resizeObserver.unobserve(videoElement)
  }

  /**
   * Handle video size changes.
   * @param {string} id - MediaStreamTrack id
   * @param {number} width - Video width
   * @param {number} height - Video height
   * @returns {void}
   */
  #onVideoSizeChanged(id, width, height) {
    this.sendVideoSize(id, width, height)
  }

  /**
   * Report video size to peer connection.
   * @param {string} id - MediaStreamTrack id
   * @param {number} width - Video width
   * @param {number} height - Video height
   * @returns {void}
   */
  sendVideoSize(id, width, height) {
    if (this.#dataChannel.readyState === 'open') {
      const data = {
        type: 'video_size',
        data: {
          track_id: id,
          width: Math.floor(width),
          height: Math.floor(height),
        },
      }

      console.debug('video size changed', data)

      this.#dataChannel.send(JSON.stringify(data))
    } else {
      const listener = () => {
        const data = {
          type: 'video_size',
          data: {
            track_id: id,
            width: Math.floor(width),
            height: Math.floor(height),
          },
        }

        console.debug('video size changed', data)
        this.#dataChannel.send(JSON.stringify(data))
        this.#dataChannel.removeEventListener('open', listener)
      }

      this.#dataChannel.addEventListener('open', listener)
    }
  }
}
