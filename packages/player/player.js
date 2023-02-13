/* eslint-disable @typescript-eslint/ban-ts-comment */
// import { shaka } from 'shaka-player/dist/shaka-player.ui.js'
import * as shaka from 'shaka-player'
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
   * Callback to be invoked when attribute is changed
   *
   * @param {string} name - attribute name
   * @param {string} oldValue - old value
   * @param {string} newValue - new value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    console.log(name, newValue)
    super.attributeChangedCallback(name, oldValue, newValue)
    if (name === 'src' && newValue !== oldValue) {
      this.loadManifest()
    }
  }

  /**
   * Callback to be invoked when element is connected to the DOM
   */
  connectedCallback() {
    super.connectedCallback()
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
