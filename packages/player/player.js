/* eslint-disable @typescript-eslint/ban-ts-comment */
/*@ts-ignore */
import shaka from 'shaka-player'
import { html, css, LitElement } from 'lit'
import { Internal } from '../internal/index.js'
import { fetchStream } from '../stream/fetch-stream/fetch-stream.js'
import merge from 'lodash-es/merge.js'
import { track } from '../stream/analytics/analytics.js'
import { api } from '../internal/config/api.js'
import { Stream } from '../stream/stream.js'

/**
 * @class InlivePlayer
 * @augments LitElement
 */
export class InlivePlayer extends LitElement {
  static styles = css`
    *,
    ::after,
    ::before {
      all: unset;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :host {
      --player-width: 100%;
      --player-height: auto;
      --player-max-width: 100%;
      --player-max-height: none;

      display: block;
      width: var(--player-width);
      height: var(--player-height);
      max-width: var(--player-max-width);
      max-height: var(--player-max-height);
    }

    video {
      max-width: 100%;
      max-height: 100%;
      width: 100%;
      height: 100%;
      object-fit: cover;
      vertical-align: middle;
    }
  `

  static properties = {
    src: { type: String },
    muted: { type: Boolean },
    autoplay: { type: Boolean },
    playsinline: { type: Boolean },
    stream: { state: true },
  }

  /**
   *
   */
  constructor() {
    super()
    /**@type {string} */
    this.src = ''
    /**@type {boolean} */
    this.muted = false
    /**@type {boolean} */
    this.autoplay = false
    /**@type {boolean} */
    this.playsinline = false
    /**@type {HTMLVideoElement | null} */
    this.video = null
    /**@type {any} */
    this.player = null
    /**@type {EventSource | null} */
    this.eventSource = null
    /**@type {import('../stream/fetch-stream/fetch-stream.js').StreamResponse | null} */
    this.stream = null
    /**@ts-ignore */
    /** @type {{elapsedTimeInSeconds: number, clientTimeInUnixMillis: number } | null} */
    this.stall = null
    /** @type {import('../internal/config/api.js').API} */
    this.api = api
    this.config = {
      player: {
        streaming: {
          lowLatencyMode: true,
          inaccurateManifestTolerance: 0,
          rebufferingGoal: 1,
          bufferingGoal: 2,
        },
        manifest: {
          dash: {
            ignoreMinBufferTime: true,
          },
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
  async updated(changedProperties) {
    if (changedProperties.has('src')) {
      const oldValue = changedProperties.get('src')
      if (this.src !== oldValue && this.src.trim().length > 0) {
        this.stream = await fetchStream(
          this.getApiUrl(),
          this.getStreamId(this.src)
        )

        if (!this.stream.endedAt) {
          this.attachListener()
          this.subscribeToEventSource(this.src)
          this.loadManifest(this.src)
        }
      } else if (
        this.src !== oldValue &&
        this.src.trim().length === 0 &&
        this.player.getAssetUri()
      ) {
        this.unsubscribeFromEventSource()
        this.unloadManifest()
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
    } else {
      throw new TypeError('Element is not a valid video element')
    }
  }

  /**
   * Load a manifest into the player
   *
   * @param {string} source - Manifest URL source
   */
  async loadManifest(source) {
    try {
      await this.player.load(source)
    } catch (error) {
      console.log(error)
    }
  }

  /**
   *
   */
  async unloadManifest() {
    try {
      await this.player.unload()
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

            const body = {
              elapsedTimeInSeconds: this.getLiveEdge(),
              clientTimeInUnixMillis: Date.now(),
              clientID: '',
              name: 'segment_downloaded_event',
              data: {
                type: manifestFormat,
                segmentFile: this.getSegmentNumber(fileName).segmentNumber,
                representationID:
                  this.getSegmentNumber(fileName).representationId,
                bufferLevelInMilliseconds: this.getBufferLevel(),
                liveLatencyInMilliseconds: this.getLiveLatency(),
                segmentBitrateInKilobits: segmentBitrate,
                downloadTimeInMilliseconds: this.getTimeSegmentDownloaded(
                  response.uri
                ),
              },
            }

            this.sendReport(body)
          }
        }
      }
    )

    this.player.addEventListener('loaded', () => {
      const stats = this.player.getStats()
      const manifestTimeInMilliseconds = Math.round(
        stats.manifestTimeSeconds * 1000
      )

      const body = {
        elapsedTimeInSeconds: this.getLiveEdge(),
        clientTimeInUnixMillis: Date.now(),
        clientID: '',
        name: 'loaded_event',
        data: {
          selectedBitrateInKilobits: this.bitToKilobit(stats.streamBandwidth),
          manifestTimeInMilliseconds,
        },
      }

      this.sendReport(body)
    })

    this.player.addEventListener('stalldetected', () => {
      this.stall = {
        elapsedTimeInSeconds: this.stall
          ? this.stall.elapsedTimeInSeconds
          : this.getLiveEdge(),
        clientTimeInUnixMillis: this.stall
          ? this.stall.clientTimeInUnixMillis
          : Date.now(),
      }
    })

    this.video &&
      this.video.addEventListener('playing', () => {
        if (this.stall) {
          const {
            elapsedTimeInSeconds = this.getLiveEdge(),
            clientTimeInUnixMillis = Date.now(),
          } = this.stall

          const stats = this.player.getStats()
          const stallDurationInMilliseconds =
            Date.now() - clientTimeInUnixMillis

          const body = {
            clientID: '',
            elapsedTimeInSeconds,
            clientTimeInUnixMillis,
            name: 'stall_event',
            data: {
              selectedBitrateInKilobits: this.bitToKilobit(
                stats.streamBandwidth
              ),
              estimatedBandwidthInKilobits: this.bitToKilobit(
                stats.estimatedBandwidth
              ),
              stallDurationInMilliseconds,
            },
          }

          this.stall = null
          this.sendReport(body)
        }
      })

    this.player.addEventListener('adaptation', () => {
      const stats = this.player.getStats()

      const body = {
        elapsedTimeInSeconds: this.getLiveEdge(),
        clientTimeInUnixMillis: Date.now(),
        clientID: '',
        name: 'adaptation_event',
        data: {
          selectedBitrateInKilobits: this.bitToKilobit(stats.streamBandwidth),
          estimatedBandwidthInKilobits: this.bitToKilobit(
            stats.estimatedBandwidth
          ),
        },
      }

      this.sendReport(body)
    })

    this.player.addEventListener(
      'error',
      /** @param {Object<string, any>} event - Error event object */
      (event) => {
        const { detail = {} } = event
        const { code } = detail

        const errorCode = Object.keys(shaka.util.Error.Code).find((key) => {
          return shaka.util.Error.Code[key] === code
        })

        const body = {
          elapsedTimeInSeconds: this.getLiveEdge(),
          clientTimeInUnixMillis: Date.now(),
          clientID: '',
          name: 'error_event',
          data: {
            code: errorCode,
          },
        }

        this.sendReport(body)
      }
    )
  }

  /**
   * Subscribe to sse using event source
   *
   * @param {string} source - Manifest URL source
   * @returns {EventSource} Returns the event source object
   */
  subscribeToEventSource(source) {
    if (this.eventSource instanceof EventSource) {
      this.unsubscribeFromEventSource()
    }

    const apiUrl = this.getApiUrl()
    const streamID = this.getStreamId(source)

    this.eventSource = new EventSource(`${apiUrl}/streams/${streamID}/events`, {
      withCredentials: true,
    })

    this.eventSource.addEventListener(Stream.ENDED, () => {
      this.src = ''
    })

    this.eventSource.addEventListener(Stream.ERROR, (event) => {
      console.log(Stream.ERROR, JSON.parse(event.data))
    })

    this.eventSource.addEventListener('error', (event) => {
      console.log(event)
    })

    return this.eventSource
  }

  /**
   * Unsubscribe from sse
   */
  unsubscribeFromEventSource() {
    if (this.eventSource instanceof EventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }

  /**
   * Get the base URL of API endpoint
   *
   * @returns {string} baseURL - return string of API base URL with its version
   */
  getApiUrl() {
    const apiConfig = Internal.config.api

    if (this.api) {
      merge(apiConfig, this.api)
    }

    return `${apiConfig.baseUrl}/${apiConfig.version}`
  }

  /**
   *
   * @param {number} bit - Number of bit provided
   * @returns {number} kilobit - Returns the number of kilobit from the provided bit
   */
  bitToKilobit(bit) {
    return Math.round(bit / 1000)
  }

  /**
   *
   * @param {number} bytes - Number of bytes provided
   * @returns {number} bit - Returns the number of bits from the provided bytes
   */
  byteToBit(bytes) {
    const roundedBytes = Math.round(bytes)
    return roundedBytes * 8
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
   * Get the live edge time. A.K.A the live stream elapsed time.
   *
   * @returns {number} liveEdge - Returns the live edge time in seconds
   */
  getLiveEdge() {
    const stats = this.player.getStats()
    const maxSegmentSizeInMs = stats.maxSegmentDuration * 1000

    const availabilityStartTimeInMs = this.player
      .getPresentationStartTimeAsDate()
      .getTime()

    const now = Date.now()
    const liveEdgeTimeInMs =
      now - availabilityStartTimeInMs - maxSegmentSizeInMs

    return liveEdgeTimeInMs / 1000
  }

  /**
   * @returns {number} latencyInMs - Returns number of live latency in ms
   */
  getLiveLatency() {
    const availabilityStartTimeInMs = this.player
      .getPresentationStartTimeAsDate()
      .getTime()

    const seekRangeEndInMs = Math.floor(this.player.seekRange().end * 1000)
    const now = availabilityStartTimeInMs + seekRangeEndInMs
    const latencyInMs = Date.now() - now
    return latencyInMs
  }

  /**
   *
   * @param {string} segmentURI - The segment URI
   * @returns {number} segmentDownloadedTimeInMs - The segment downloaded time in milliseconds
   */
  getTimeSegmentDownloaded(segmentURI) {
    const segmentPerformance = window.performance.getEntriesByName(
      segmentURI,
      'resource'
    )

    let segmentDownloadedTimeInMs = 0

    for (const data of segmentPerformance) {
      const duration = Math.round(data.duration)
      segmentDownloadedTimeInMs = segmentDownloadedTimeInMs + duration
    }

    return segmentDownloadedTimeInMs
  }

  /**
   * @typedef BufferedRange
   * @property {number} start - start buffer time
   * @property {number} end - end buffer time
   */

  /**
   *
   * @param {TimeRanges} bufferedMedia - The media buffered time ranges object
   * @returns {BufferedRange[]} bufferedRange - Returns an array contains buffered range
   */
  getBufferedRange(bufferedMedia) {
    /** @type {BufferedRange[]} */
    const data = []

    if (!(bufferedMedia instanceof TimeRanges)) return data

    for (let index = 0; index < bufferedMedia.length; index++) {
      data.push({
        start: bufferedMedia.start(index),
        end: bufferedMedia.end(index),
      })
    }

    return data
  }

  /**
   * @returns {number} bufferLevelInMs - Returns the number of buffer level in milliseconds
   */
  getBufferLevel() {
    if (this.video instanceof HTMLVideoElement) {
      const bufferedRange = this.getBufferedRange(this.video.buffered)

      let newestBuffer = 0

      for (const buffer of bufferedRange) {
        const bufferEndInSeconds = buffer.end
        newestBuffer = Math.max(newestBuffer, bufferEndInSeconds)
      }

      const videoCurrentTime = this.video.currentTime
      const bufferLevelInMs = Math.floor(
        (newestBuffer - videoCurrentTime) * 1000
      )

      return bufferLevelInMs < 0 ? 0 : bufferLevelInMs
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
    return Math.round(kilobitPerSec)
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
   *
   * @param {import('../stream/analytics/analytics.js').trackEvent} eventData - The body object which contains data needed be sent to the api
   */
  async sendReport(eventData) {
    const event_ = new CustomEvent(eventData.name, {
      detail: eventData,
    })
    this.dispatchEvent(event_)

    const streamID = this.getStreamId(this.src)

    await track(streamID, eventData, this.api)
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
