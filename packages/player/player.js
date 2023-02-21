/* eslint-disable @typescript-eslint/ban-ts-comment */
// import { shaka } from 'shaka-player/dist/shaka-player.ui.js'
import shaka from 'shaka-player'
import { html, css, LitElement } from 'lit'

/**
 * @class InlivePlayer
 * @augments LitElement
 * @property {number} streamid - stream id
 * @property {string} src - video source
 * @property {object} config - shaka player config
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
  }

  /**
   *
   */
  constructor() {
    super()
    this.src = ''
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
   * Callback to be invoked when a property changes
   *
   * @param changedProperties - the property that changes
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
   * Called after the component's DOM has been updated the first time
   */
  firstUpdated() {
    this.init()
  }

  /**
   *
   */
  init() {
    shaka.polyfill.installAll()
    // Check to see if the browser supports the basic APIs Shaka needs.
    if (shaka.Player.isBrowserSupported()) {
      // Everything looks good!
      this.initPlayer()
    } else {
      // This browser does not have the minimum set of APIs we need.
      console.error('Browser not supported!')
    }
  }

  /**
   * init Shaka player and configure it
   */
  initPlayer() {
    // Create a Player instance.
    // @ts-ignore
    this.video = this.shadowRoot.querySelector('video')
    this.player = new shaka.Player(this.video)
    this.player.configure(this.config.player)

    // Listen for error events.
    this.player.addEventListener('error', (event_) => {
      console.log(event_)
    })
  }

  /**
   *    Load a manifest into the player
   */
  async loadManifest() {
    // Try to load a manifest.
    // This is an asynchronous process.
    try {
      await this.player.load(this.src)
      // This runs if the asynchronous load is successful.
      console.log('The video has now been loaded!')
    } catch (error) {
      // onError is executed if the asynchronous load fails.
      console.log(error)
    }
  }

  /**
   * Render html component
   *
   * @returns {import('lit').TemplateResult} - html template
   */
  render() {
    return html` <video controls autoplay></video> `
  }
}

customElements.define('inlive-player', InlivePlayer)
