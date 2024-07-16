import { createAuth } from './auth.js'

/** @param {import('./api-types.js').RoomAPIType.ApiDependencies} apiDeps Dependencies for api module */
export const createApi = ({ fetcher, config }) => {
  const Api = class {
    _fetcher
    /** @type {import('./api-types.js').RoomAPIType.ApiAuth | null} */
    _auth = null

    constructor() {
      this._fetcher = fetcher
    }

    /**
     * @param {string} [name]
     * @param {string} [id]
     * @param {import('./api-types.js').RoomAPIType.RoomUserOptions} [options]
     * @returns {Promise<import('./api-types.js').RoomAPIType.RoomReturnBody>}
     */
    createRoom = async (name = '', id = '', options) => {
      const requestOptions = {}

      if (options !== undefined) {
        requestOptions.bitrates =
          options.bitrates === undefined
            ? {}
            : {
                audio: options.bitrates.audio || 0,
                audio_red: options.bitrates.audioRed || 0,
                video: options.bitrates.video || 0,
                video_high: options.bitrates.videoHigh || 0,
                video_high_pixels: options.bitrates.videoHighPixels || 0,
                video_mid: options.bitrates.videoMid || 0,
                video_mid_pixels: options.bitrates.videoMidPixels || 0,
                video_low: options.bitrates.videoLow || 0,
                video_low_pixels: options.bitrates.videoLowPixels || 0,
                initial_bandwidth: options.bitrates.initialBandwidth || 0,
              }

        requestOptions.quality_presets =
          options.qualityPresets === undefined
            ? {}
            : {
                high: {
                  sid: options.qualityPresets.high?.sid || 2,
                  tid: options.qualityPresets.high?.tid || 2,
                },
                mid: {
                  sid: options.qualityPresets.mid?.sid || 1,
                  tid: options.qualityPresets.mid?.tid || 1,
                },
                low: {
                  sid: options.qualityPresets.low?.sid || 0,
                  tid: options.qualityPresets.low?.tid || 0,
                },
              }

        requestOptions.codecs = options.codecs || []
        requestOptions.pli_interval_ns = options.pliIntervalMS
          ? options.pliIntervalMS * 1_000_000
          : 0

        requestOptions.empty_room_timeout_ns = options.emptyRoomTimeoutMS
          ? options.emptyRoomTimeoutMS * 1_000_000
          : 0
      }

      const body = {
        id,
        name,
        options: requestOptions,
      }

      this._auth = await this._createAuthIfNotSet()

      /** @type {import('./api-types.js').RoomAPIType.RoomResponseBody} */
      const response = await this._fetcher.post(`/rooms/create`, {
        headers: { Authorization: 'Bearer ' + this._auth.accessToken },
        body: JSON.stringify(body),
      })

      if (response.headers.get('x-access-token-expired')) {
        const authResponse = await createAuth({
          apiKey: this._auth.refreshToken,
        })
        this._auth = this.setAuth(authResponse)
        return this.createRoom(name, id, options)
      }

      const data = response.data || {}
      const roomOptions = data.options || {}
      const bitrates = roomOptions.bitrates || {}
      const qualityPresets = roomOptions.quality_presets || {}

      /** @type {import('./api-types.js').RoomAPIType.RoomReturnBody} */
      const room = {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: {
          id: data.id || '',
          name: data.name || '',
          options: {
            bitrates: {
              audio: bitrates.audio || 0,
              audioRed: bitrates.audio_red || 0,
              video: bitrates.video || 0,
              videoHigh: bitrates.video_high || 0,
              videoHighPixels: bitrates.video_high_pixels || 0,
              videoMid: bitrates.video_mid || 0,
              videoMidPixels: bitrates.video_mid_pixels || 0,
              videoLow: bitrates.video_low || 0,
              videoLowPixels: bitrates.video_low_pixels || 0,
              initialBandwidth: bitrates.initial_bandwidth || 0,
            },
            codecs: roomOptions.codecs || [],
            pliIntervalMS: roomOptions.pli_interval_ns / 1_000_000 || 0,
            emptyRoomTimeoutMS:
              roomOptions.empty_room_timeout_ns / 1_000_000 || 0,
            qualityPresets: {
              high: {
                sid: qualityPresets.high?.sid,
                tid: qualityPresets.high?.tid,
              },
              mid: {
                sid: qualityPresets.mid?.sid,
                tid: qualityPresets.mid?.tid,
              },
              low: {
                sid: qualityPresets.low?.sid,
                tid: qualityPresets.low?.tid,
              },
            },
          },
        },
      }

      return room
    }

    /**
     * @param {string} roomId
     * @returns {Promise<import('./api-types.js').RoomAPIType.RoomReturnBody>}
     */
    getRoom = async (roomId) => {
      if (typeof roomId !== 'string' || roomId.trim().length === 0) {
        throw new Error('Room ID must be a valid string')
      }

      this._auth = await this._createAuthIfNotSet()

      /** @type {import('./api-types.js').RoomAPIType.RoomResponseBody} */
      const response = await this._fetcher.get(`/rooms/${roomId}`, {
        headers: { Authorization: 'Bearer ' + this._auth.accessToken },
      })

      if (response.headers.get('x-access-token-expired')) {
        const authResponse = await createAuth({
          apiKey: this._auth.refreshToken,
        })
        this._auth = this.setAuth(authResponse)
        return this.getRoom(roomId)
      }

      const data = response.data || {}
      const roomOptions = data.options || {}
      const bitrates = roomOptions.bitrates || {}
      const qualityPresets = roomOptions.quality_presets || {}

      /** @type {import('./api-types.js').RoomAPIType.RoomReturnBody} */
      const room = {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: {
          id: data.id || '',
          name: data.name || '',
          options: {
            bitrates: {
              audio: bitrates.audio || 0,
              audioRed: bitrates.audio_red || 0,
              video: bitrates.video || 0,
              videoHigh: bitrates.video_high || 0,
              videoHighPixels: bitrates.video_high_pixels || 0,
              videoMid: bitrates.video_mid || 0,
              videoMidPixels: bitrates.video_mid_pixels || 0,
              videoLow: bitrates.video_low || 0,
              videoLowPixels: bitrates.video_low_pixels || 0,
              initialBandwidth: bitrates.initial_bandwidth || 0,
            },
            codecs: roomOptions.codecs || [],
            pliIntervalMS: roomOptions.pli_interval_ns / 1_000_000 || 0,
            emptyRoomTimeoutMS:
              roomOptions.empty_room_timeout_ns / 1_000_000 || 0,
            qualityPresets: {
              high: {
                sid: qualityPresets.high?.sid,
                tid: qualityPresets.high?.tid,
              },
              mid: {
                sid: qualityPresets.mid?.sid,
                tid: qualityPresets.mid?.tid,
              },
              low: {
                sid: qualityPresets.low?.sid,
                tid: qualityPresets.low?.tid,
              },
            },
          },
        },
      }

      return room
    }

    /**
     * @param {string} roomId
     * @param {{clientId?: string, clientName?: string, enableVAD?: boolean}} [config]
     * @returns {Promise<import('./api-types.js').RoomAPIType.RegisterClientReturn>}
     */
    registerClient = async (roomId, config = {}) => {
      if (typeof roomId !== 'string' || roomId.trim().length === 0) {
        throw new Error('Room ID must be a valid string')
      }

      /** @type {import('./api-types.js').RoomAPIType.RegisterClientRequestBody} */
      const body = {}

      if (config.clientId && config.clientId.trim().length > 0) {
        body.uid = config.clientId
      }

      if (config.clientName && config.clientName.trim().length > 0) {
        body.name = config.clientName
      }

      if (typeof config.enableVAD === 'boolean') {
        body.enable_vad = config.enableVAD
      }

      this._auth = await this._createAuthIfNotSet()

      /** @type {RequestInit} */
      const options = {
        headers: { Authorization: 'Bearer ' + this._auth.accessToken },
      }

      if (body.uid || body.name) {
        options.body = JSON.stringify(body)
      }

      /** @type {import('./api-types.js').RoomAPIType.RegisterClientResponseBody} */
      const response = await this._fetcher.post(
        `/rooms/${roomId}/register`,
        options
      )

      if (response.headers.get('x-access-token-expired')) {
        const authResponse = await createAuth({
          apiKey: this._auth.refreshToken,
        })
        this._auth = this.setAuth(authResponse)
        return this.registerClient(roomId, config)
      }

      const data = response.data || {}
      const bitrates = data.bitrates || {}

      const client = {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: {
          clientId: data.client_id || '',
          clientName: data.name || '',
          bitrates: {
            audio: bitrates.audio || 0,
            audioRed: bitrates.audio_red || 0,
            video: bitrates.video || 0,
            videoHigh: bitrates.video_high || 0,
            videoHighPixels: bitrates.video_high_pixels || 0,
            videoMid: bitrates.video_mid || 0,
            videoMidPixels: bitrates.video_mid_pixels || 0,
            videoLow: bitrates.video_low || 0,
            videoLowPixels: bitrates.video_low_pixels || 0,
            initialBandwidth: bitrates.initial_bandwidth || 0,
          },
        },
      }

      return client
    }

    /**
     * @param {string} roomId
     * @param {string} clientId
     */
    getClient = async (roomId, clientId) => {
      if (roomId.trim().length === 0) {
        throw new Error('Room ID must be a valid string')
      }

      if (clientId.trim().length === 0) {
        throw new Error('Client ID must be a valid string')
      }

      /** @type {import('./api-types.js').RoomAPIType.GetClientResponseBody} */
      const response = await this._fetcher.get(
        `/rooms/${roomId}/client/${clientId}`
      )

      const data = response.data || {}
      const events = data.events || {}

      return {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: {
          clientId: data.id || '',
          clientName: data.name || '',
          connectionState: data.peer_connection_state || '',
          iceConnectionState: data.ice_peer_connection_state || '',
          events: events,
        },
      }
    }

    /**
     *
     * @param {string} roomId
     * @param {string} clientId
     * @param {string} clientName
     */
    setClientName = async (roomId, clientId, clientName) => {
      if (roomId.trim().length === 0) {
        throw new Error('Room ID must be a valid string')
      }

      if (clientId.trim().length === 0) {
        throw new Error('Client ID must be a valid string')
      }

      if (clientName.trim().length === 0) {
        throw new Error('Client name must be a valid string')
      }

      /** @type {import('./api-types.js').RoomAPIType.SetClientNameResponse} */
      const response = await this._fetcher.put(
        `/rooms/${roomId}/setname/${clientId}`,
        {
          body: JSON.stringify({
            name: clientName,
          }),
        }
      )

      const data = response.data || {}
      const bitrates = data.bitrates || {}

      return {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: {
          clientId: data.client_id || '',
          clientName: data.name || '',
          bitrates: {
            audio: bitrates.audio || 0,
            audioRed: bitrates.audio_red || 0,
            video: bitrates.video || 0,
            videoHigh: bitrates.video_high || 0,
            videoHighPixels: bitrates.video_high_pixels || 0,
            videoMid: bitrates.video_mid || 0,
            videoMidPixels: bitrates.video_mid_pixels || 0,
            videoLow: bitrates.video_low || 0,
            videoLowPixels: bitrates.video_low_pixels || 0,
            initialBandwidth: bitrates.initial_bandwidth || 0,
          },
        },
      }
    }

    /**
     * @param {string} roomId
     * @param {string} key
     */
    getMetadata = async (roomId, key) => {
      if (roomId.trim().length === 0) {
        throw new Error('Room ID must be a valid string')
      }

      if (key.trim().length === 0) {
        throw new Error('Metadata key must be a valid string')
      }

      /** @type {import('./api-types.js').RoomAPIType.GetMetadataResponse} */
      const response = await this._fetcher.get(
        `/rooms/${roomId}/getmeta/${key}`
      )

      const data = response.data || {}

      const result = {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: data,
      }

      return result
    }

    /**
     * @param {string} roomId
     * @param {{[key: string]: any}} metadata
     */
    setMetadata = async (roomId, metadata) => {
      if (!roomId) {
        throw new Error('Room ID is required')
      }

      if (
        typeof metadata !== 'object' ||
        metadata === null ||
        Array.isArray(metadata)
      ) {
        throw new TypeError('Metadata must be a valid object')
      }

      /** @type {import('./api-types.js').RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.post(`/rooms/${roomId}/setmeta`, {
        body: JSON.stringify(metadata),
      })

      const result = {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: null,
      }

      return result
    }

    /**
     * @param {string} roomId
     * @param {string} key
     */
    deleteMetadata = async (roomId, key) => {
      if (roomId.trim().length === 0) {
        throw new Error('Room ID must be a valid string')
      }

      if (key.trim().length === 0) {
        throw new Error('Metadata key must be a valid string')
      }

      /** @type {import('./api-types.js').RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.delete(
        `/rooms/${roomId}/deletemeta/${key}`
      )

      const result = {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: null,
      }

      return result
    }

    /**
     * @param {string} roomId
     * @param {string} clientId
     * @param {RTCIceCandidate} candidate
     */
    sendIceCandidate = async (roomId, clientId, candidate) => {
      if (!roomId || !clientId || !candidate) {
        throw new Error(
          'Room ID, client ID, and RTC ice candidate are required'
        )
      }

      /** @type {import('./api-types.js').RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.post(
        `/rooms/${roomId}/candidate/${clientId}`,
        { body: JSON.stringify(candidate.toJSON()) }
      )

      const result = {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: null,
      }

      return result
    }

    /**
     * @param {string} roomId
     * @param {string} clientId
     */
    checkNegotiateAllowed = async (roomId, clientId) => {
      if (!roomId || !clientId) {
        throw new Error('Room ID, and client ID are required')
      }

      /** @type {import('./api-types.js').RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.post(
        `/rooms/${roomId}/isallownegotiate/${clientId}`
      )

      const result = {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: null,
      }

      return result
    }

    /**
     * @param {string} roomId
     * @param {string} clientId
     * @param {RTCSessionDescription} localDescription
     */
    negotiateConnection = async (roomId, clientId, localDescription) => {
      if (!roomId || !clientId || !localDescription) {
        throw new Error(
          'Room ID, client ID, and RTC local description are required'
        )
      }

      /** @type {import('./api-types.js').RoomAPIType.NegotiateConnectionResponseBody} */
      const response = await this._fetcher.put(
        `/rooms/${roomId}/negotiate/${clientId}`,
        {
          body: JSON.stringify(localDescription.toJSON()),
        }
      )

      const data = response.data || {}

      const result = {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: {
          answer: data.answer,
        },
      }

      return result
    }

    /**
     * @param {string} roomId
     * @param {string} clientId
     * @param {import('./api-types.js').RoomAPIType.TrackSourcesRequestBody[]} trackSources
     */
    setTrackSources = async (roomId, clientId, trackSources) => {
      if (!roomId || !clientId) {
        throw new Error('Room ID, and client ID are required')
      }

      if (!Array.isArray(trackSources)) {
        throw new TypeError(
          'Third parameters must be a valid array of objects with source and track_id properties'
        )
      }

      /** @type {import('./api-types.js').RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.put(
        `/rooms/${roomId}/settracksources/${clientId}`,
        {
          body: JSON.stringify(trackSources),
        }
      )

      const result = {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: null,
      }

      return result
    }

    /**
     * @param {string} roomId
     * @param {string} clientId
     * @param {import('./api-types.js').RoomAPIType.SubscribeTracksRequestBody[]} subscribeTracks
     */
    subscribeTracks = async (roomId, clientId, subscribeTracks) => {
      if (!roomId || !clientId) {
        throw new Error('Room ID, and client ID are required')
      }

      if (!Array.isArray(subscribeTracks)) {
        throw new TypeError(
          'Third parameters must be a valid array of objects with client_id, stream_id, and track_id properties'
        )
      }

      /** @type {import('./api-types.js').RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.post(
        `/rooms/${roomId}/subscribetracks/${clientId}`,
        {
          body: JSON.stringify(subscribeTracks),
        }
      )

      const result = {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: null,
      }

      return result
    }

    /**
     * @param {string} roomId
     * @param {string} clientId
     * @param {boolean} useBeacon
     */
    leaveRoom = async (roomId, clientId, useBeacon = false) => {
      if (!roomId || !clientId) {
        throw new Error('Room ID, and client ID are required')
      }

      const endpoint = `/rooms/${roomId}/leave/${clientId}`

      if (useBeacon) {
        const response = navigator.sendBeacon(
          `${this._fetcher.getBaseUrl()}${endpoint}`
        )

        const result = {
          code: response ? 200 : 500,
          ok: response,
          message: response ? 'OK' : '',
          data: null,
        }

        return result
      }

      /** @type {import('./api-types.js').RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.delete(
        `/rooms/${roomId}/leave/${clientId}`,
        {
          keepalive: true,
        }
      )

      const result = {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: null,
      }

      return result
    }

    /**
     * @param {string} roomId
     * @returns {Promise<import('./api-types.js').RoomAPIType.BaseResponseReturn>}
     */
    endRoom = async (roomId) => {
      if (typeof roomId !== 'string' || roomId.trim().length === 0) {
        throw new Error('Room ID must be a valid string')
      }

      this._auth = await this._createAuthIfNotSet()

      /** @type {import('./api-types.js').RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.put(`/rooms/${roomId}/end`, {
        headers: { Authorization: 'Bearer ' + this._auth.accessToken },
      })

      if (response.headers.get('x-access-token-expired')) {
        const authResponse = await createAuth({
          apiKey: this._auth.refreshToken,
        })
        this._auth = this.setAuth(authResponse)
        return this.endRoom(roomId)
      }

      const result = {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: null,
      }

      return result
    }

    /**
     *
     * @param {string} roomId
     * @param {string} name
     * @param {boolean} ordered
     */
    createDataChannel = async (roomId, name, ordered = true) => {
      if (typeof roomId !== 'string' || roomId.trim().length === 0) {
        throw new Error('Room ID must be a valid string')
      }

      if (typeof roomId !== 'string' || roomId.trim().length === 0) {
        throw new Error('Channel name must be a valid string')
      }

      if (typeof ordered !== 'boolean') {
        ordered = true
      }

      /** @type {import('./api-types.js').RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.post(
        `/room/${roomId}/channel/create`,
        {
          body: JSON.stringify({ name: name, mode: ordered }),
        }
      )

      return {
        url: response.url,
        headers: response.headers,
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: null,
      }
    }

    _createAuthIfNotSet = async () => {
      if (!config.api.apiKey && !this._auth) {
        throw new Error(
          'Auth is not set properly. Use createAuth() and set the response with room.setAuth()'
        )
      }

      if (this._auth) return this._auth

      const response = await createAuth({
        apiKey: config.api.apiKey,
      })

      return this.setAuth(response)
    }

    /**
     * @typedef ReturnAccessToken
     * @property {string} url
     * @property {{expirySeconds: number, accessToken: string, refreshToken: string}} data
     */

    /**
     * @param {ReturnAccessToken} auth
     */
    setAuth = (auth) => {
      const url = new URL(auth.url)
      const apiVersion = url.pathname.split('/')[1]

      const data = {
        baseUrl: url.origin,
        apiVersion: apiVersion,
        accessToken: auth.data.accessToken,
        refreshToken: auth.data.refreshToken,
        expirySeconds: auth.data.expirySeconds,
      }

      this._auth = data
      return data
    }
  }

  return {
    createInstance: () => {
      const api = new Api()

      return {
        createRoom: api.createRoom,
        getRoom: api.getRoom,
        registerClient: api.registerClient,
        getClient: api.getClient,
        setClientName: api.setClientName,
        getMetadata: api.getMetadata,
        setMetadata: api.setMetadata,
        deleteMetadata: api.deleteMetadata,
        sendIceCandidate: api.sendIceCandidate,
        checkNegotiateAllowed: api.checkNegotiateAllowed,
        negotiateConnection: api.negotiateConnection,
        setTrackSources: api.setTrackSources,
        subscribeTracks: api.subscribeTracks,
        leaveRoom: api.leaveRoom,
        endRoom: api.endRoom,
        createDataChannel: api.createDataChannel,
        setAuth: api.setAuth,
      }
    },
  }
}
