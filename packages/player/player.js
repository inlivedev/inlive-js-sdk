/* eslint-disable @typescript-eslint/ban-ts-comment */
/*@ts-ignore */
import shaka from 'shaka-player'
import { html, css, LitElement } from 'lit'
import { track } from '../stream/analytics/analytics.js'
import { api } from '../internal/config/api.js'

/**
 * @class InlivePlayer
 * @augments LitElement
 * @property {number} streamid - stream id
 * @property {string} src - video source
 * @property {object} config - shaka player config
 * @property {import('../../internal/config/api.js').API} api - api config
 * @property {object} player - shaka player instance
 * @property {object} video -  video element
 */
export class InlivePlayer extends LitElement {
  static styles = css`
    video {
      max-width: 100%;
      width: 100%;
      height: 100%;
    }
  `

  static properties = {
    src: { type: String },
    muted: { type: Boolean },
    autoplay: { type: Boolean },
    playsinline: { type: Boolean },
  }

  /**
   *
   */
  constructor() {
    super()
    this.src = ''
    this.muted = false
    this.autoplay = false
    this.playsinline = false
    this.video = null
    this.player = null
    /**@ts-ignore */
    this.stall = null
    this.api = api
    this.config = {
      player: {
        streaming: {
          bufferingGoal: 0.7,
          lowLatencyMode: true,
          inaccurateManifestTolerance: 0,
          rebufferingGoal: 0.01,
        },
      },
    }
  }

  /**
   * Called after the component's DOM has been updated the first time
   */
  firstUpdated() {
    this.init()
  }

  /**
   * Callback to be invoked when a property changes
   *
   * @param {import('lit').PropertyValues} changedProperties - the property that changes
   */
  updated(changedProperties) {
    if (changedProperties.has('src')) {
      const oldValue = changedProperties.get('src')
      if (this.src !== oldValue && this.src.length > 0) {
        this.loadManifest()
      }
    }
  }

  /**
   *
   */
  init() {
    shaka.polyfill.installAll()

    if (shaka.Player.isBrowserSupported()) {
      this.initPlayer()
    } else {
      console.error('Browser not supported!')
    }
  }

  /**
   * init Shaka player and configure it
   */
  initPlayer() {
    this.video = this.renderRoot.querySelector('video')

    if (this.video instanceof HTMLVideoElement) {
      this.video.autoplay = this.autoplay
      this.video.muted = this.muted
      this.video.playsInline = this.playsinline

      this.player = new shaka.Player(this.video)
      this.player.configure(this.config.player)
      this.attachListener()
    } else {
      throw new TypeError('Element is not a valid video element')
    }
  }

  /**
   *    Load a manifest into the player
   */
  async loadManifest() {
    try {
      this.player.load(this.src)
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * Attach listeners
   */
  attachListener() {
    const networkingEngine = this.player.getNetworkingEngine()

    networkingEngine.registerResponseFilter(
      /**
       * @param {number} type - The request type
       * @param {Object<string, any>} response - The response object. This includes the response data and header info
       */
      (type, response) => {
        if (type === shaka.net.NetworkingEngine.RequestType.SEGMENT) {
          const fileName = this.getFileName(response.uri)

          if (fileName.indexOf('chunk') === 0) {
            const segmentPerformance = window.performance.getEntriesByName(
              response.uri,
              'resource'
            )

            const downloadTimeInMs = segmentPerformance[0]?.duration
            const manifestExtension = this.getFileExtension(this.src)

            let manifestFormat

            if (manifestExtension === 'mpd') {
              manifestFormat = 'DASH'
            } else if (manifestExtension === 'm3u8') {
              manifestFormat = 'HLS'
            }

            const stats = this.player.getStats()

            const segmentBitrate = this.getSegmentBitrate(
              response.data.byteLength,
              stats.maxSegmentDuration
            )

            const liveLatencyInSeconds = stats.liveLatency
            const liveLatencyInMs = liveLatencyInSeconds * 1000

            const bufferedInfo = this.player.getBufferedInfo()
            const bufferedTotal = bufferedInfo.total

            let newestBuffer = 0

            for (const buffer of bufferedTotal) {
              newestBuffer = Math.max(newestBuffer, buffer.end)
            }

            const body = {
              elapsedTime: this.getElapsedTime(),
              clientTime: Date.now(),
              streamID: this.getStreamId(this.src),
              clientID: '',
              name: 'segmentDownloaded',
              data: {
                type: manifestFormat,
                segmentFile: this.getSegmentNumber(fileName).segmentNumber,
                representationID:
                  this.getSegmentNumber(fileName).representationId,
                bufferLevel: newestBuffer - (this.video?.currentTime || 0),
                liveLatency: liveLatencyInMs,
                segmentBitrate: segmentBitrate,
                downloadTime: downloadTimeInMs,
              },
            }

            this.sendReport(body)
          }
        }
      }
    )

    this.player.addEventListener('loaded', () => {
      const stats = this.player.getStats()

      const body = {
        elapsedTime: this.getElapsedTime(),
        clientTime: Date.now(),
        streamID: this.getStreamId(this.src),
        clientID: '',
        name: 'loadedEvent',
        data: {
          selectedBitrate: this.bitToKb(stats.streamBandwidth),
          manifestTime: stats.manifestTimeSeconds,
        },
      }

      this.sendReport(body)
    })

    this.player.addEventListener('stalldetected', () => {
      if (this.video instanceof HTMLVideoElement) {
        this.stall = {
          elapsedTime: this.stall
            ? this.stall.elapsedTime
            : this.getElapsedTime(),
          clientTime: this.stall ? this.stall.clientTime : Date.now(),
        }
      }
    })

    this.video &&
      this.video.addEventListener('playing', () => {
        if (this.stall) {
          const {
            elapsedTime = this.getElapsedTime(),
            clientTime = Date.now(),
          } = this.stall
          const stats = this.player.getStats()

          const stallDurationInSeconds = (Date.now() - clientTime) / 1000

          const body = {
            streamID: this.getStreamId(this.src),
            clientID: '',
            elapsedTime,
            clientTime,
            name: 'stallEvent',
            data: {
              selectedBitrate: this.bitToKb(stats.streamBandwidth),
              estimatedBandwidth: this.bitToKb(stats.estimatedBandwidth),
              stallDuration: stallDurationInSeconds,
            },
          }

          this.stall = null
          this.sendReport(body)
        }
      })

    this.player.addEventListener('adaptation', () => {
      const stats = this.player.getStats()

      const body = {
        elapsedTime: this.getElapsedTime(),
        clientTime: Date.now(),
        streamID: this.getStreamId(this.src),
        clientID: '',
        name: 'adaptationEvent',
        data: {
          selectedBitrate: this.bitToKb(stats.streamBandwidth),
          estimatedBandwidth: this.bitToKb(stats.estimatedBandwidth),
        },
      }

      this.sendReport(body)
    })

    this.player.addEventListener(
      'error',
      /** @param {Object<string, any>} event - Error event object */
      (event) => {
        const { detail } = event

        const body = {
          elapsedTime: this.getElapsedTime(),
          clientTime: Date.now(),
          streamID: this.getStreamId(this.src),
          clientID: '',
          name: 'errorEvent',
          data: {
            code: detail.code,
          },
        }

        this.sendReport(body)
      }
    )
  }

  /**
   *
   * @param {number} bits - Number of bits provided
   * @returns {number} kb - Returns the number of kilobytes from the provided bits
   */
  bitToKb(bits) {
    return bits / 8 / 1000
  }

  /**
   *
   * @param {number} bytes - Number of bytes provided
   * @returns {number} bit - Returns the number of bits from the provided bytes
   */
  byteToBit(bytes) {
    return bytes * 8
  }

  /**
   * Get the ID of the stream from manifest URL
   *
   * @param {string} source - Manifest URL source
   * @returns {number} streamId - The ID of the stream from manifest URL
   */
  getStreamId(source) {
    if (typeof source !== 'string' || source.trim().length === 0) return 0

    const splitUrl = source.split('/')
    const streamId = Number.parseInt(splitUrl[splitUrl.length - 2], 10)

    return !Number.isNaN(streamId) ? streamId : 0
  }

  /**
   *
   * @returns {number} elapsedTime - Live stream elapsed time in seconds
   */
  getElapsedTime() {
    if (this.video instanceof HTMLVideoElement) {
      return this.video.currentTime
    }

    return 0
  }

  /**
   * Get the ID of the segment
   *
   * @param {string} segmentURI - The segment URI
   * @returns {{
   *  segmentNumber: string,
   *  representationId: number
   * }} Returns an object contains the number inside of the segment
   */
  getSegmentNumber(segmentURI) {
    const fileNameWithoutExtension =
      this.getFileNameWithoutExtension(segmentURI)

    const splitFileName = fileNameWithoutExtension.split('-')
    const segmentNumber = splitFileName[splitFileName.length - 1]
    const representationId = Number.parseInt(
      splitFileName[splitFileName.length - 2],
      10
    )

    const result = {
      segmentNumber: segmentNumber,
      representationId: !Number.isNaN(representationId) ? representationId : 0,
    }

    return result
  }

  /**
   *
   * @param {number} segmentSizeInByte - The size of the segment in byte
   * @param {number} segmentDurationInSeconds - The segment duration in seconds
   * @returns {number} kilobit/sec - Returns the segment bitrate in kilobit/sec
   */
  getSegmentBitrate(segmentSizeInByte, segmentDurationInSeconds) {
    const segmentSizeInBit = this.byteToBit(segmentSizeInByte)
    const bitPerSec = segmentSizeInBit / segmentDurationInSeconds
    const kilobitPerSec = bitPerSec / 1000
    return Math.floor(kilobitPerSec)
  }

  /**
   *
   * @param {string} fileURI - The URI of the file
   * @returns {string} fileName - Returns the file name with extension
   */
  getFileName(fileURI) {
    if (typeof fileURI !== 'string' || fileURI.trim().length === 0) {
      return ''
    }

    return fileURI.slice(Math.max(0, fileURI.lastIndexOf('/') + 1))
  }

  /**
   *
   * @param {string} fileURI - The URI of the file
   * @returns {string} fileExtension - Returns the file extension string
   */
  getFileExtension(fileURI) {
    if (typeof fileURI !== 'string' || fileURI.trim().length === 0) {
      return ''
    }

    const indexStart = Math.max(0, fileURI.lastIndexOf('.') + 1)
    const indexEnd = fileURI.lastIndexOf('.') !== -1 ? fileURI.length : 0

    return fileURI.slice(indexStart, indexEnd)
  }

  /**
   *
   * @param {string} fileURI - The URI of the file
   * @returns {string} fileName - Returns the file name without extension
   */
  getFileNameWithoutExtension(fileURI) {
    if (typeof fileURI !== 'string' || fileURI.trim().length === 0) {
      return ''
    }

    const indexStart = Math.max(0, fileURI.lastIndexOf('/') + 1)
    const indexEnd =
      fileURI.lastIndexOf('.') !== -1
        ? fileURI.lastIndexOf('.')
        : fileURI.length
    return fileURI.slice(indexStart, indexEnd)
  }

  /**
   * Get the base report data
   *
   * @returns {Object<string, any>} baseReportData - The object which contains the base data needed to be sent to the api
   */
  getBaseReport() {
    return {
      elapsedTime: this.getElapsedTime(),
      clientTime: Date.now(),
      streamId: this.getStreamId(this.src),
      clientID: '',
    }
  }

  /**
   *
   * @param {import('../stream/analytics/analytics.js').trackEvent} body - The body object which contains data needed be sent to the api
   */
  async sendReport(body) {
    await track(body, this.api)
  }

  /**
   * Render html component
   *
   * @returns {import('lit').TemplateResult} - html template
   */
  render() {
    return html`<video controls></video>`
  }
}

customElements.define('inlive-player', InlivePlayer)
