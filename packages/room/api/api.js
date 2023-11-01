/** @param {import('./api-types.js').RoomAPIType.ApiDependencies} apiDeps Dependencies for api module */
export const createApi = ({ fetcher }) => {
  const Api = class {
    _fetcher

    constructor() {
      this._fetcher = fetcher
    }

    /**
     * @param {string} [name]
     * @param {string} [id]
     */
    createRoom = async (name = '', id = '') => {
      /** @type {import('./api-types.js').RoomAPIType.CreateRoomResponseBody} */
      const response = await this._fetcher.post(`/rooms/create`, {
        body: JSON.stringify({ name, id }),
      })

      const data = response.data || {}
      const bitrates = data.bitrates_config || {}

      const room = {
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: {
          roomId: data.room_id || '',
          roomName: data.name || '',
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

      return room
    }

    /**
     * @param {string} roomId
     */
    getRoom = async (roomId) => {
      if (typeof roomId !== 'string' || roomId.trim().length === 0) {
        throw new Error('Room ID must be a valid string')
      }

      /** @type {import('./api-types.js').RoomAPIType.GetRoomResponseBody} */
      const response = await this._fetcher.get(`/rooms/${roomId}`)

      const data = response.data || {}
      const bitrates = data.bitrates_config || {}

      const room = {
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: {
          roomId: data.room_id || '',
          roomName: data.name || '',
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

      return room
    }

    /**
     * @param {string} roomId
     * @param {{clientId?: string, clientName?: string}} [config]
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

      const options =
        body.uid || body.name ? { body: JSON.stringify(body) } : undefined

      /** @type {import('./api-types.js').RoomAPIType.RegisterClientResponseBody} */
      const response = await this._fetcher.post(
        `/rooms/${roomId}/register`,
        options
      )

      const data = response.data || {}
      const bitrates = data.bitrates || {}

      const client = {
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
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: null,
      }

      return result
    }

    /**
     * @param {string} roomId
     */
    endRoom = async (roomId) => {
      if (typeof roomId !== 'string' || roomId.trim().length === 0) {
        throw new Error('Room ID must be a valid string')
      }

      /** @type {import('./api-types.js').RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.put(`/rooms/${roomId}/end`)

      const result = {
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
        code: response.code || 500,
        ok: response.ok || false,
        message: response.message || '',
        data: null,
      }
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
        sendIceCandidate: api.sendIceCandidate,
        checkNegotiateAllowed: api.checkNegotiateAllowed,
        negotiateConnection: api.negotiateConnection,
        setTrackSources: api.setTrackSources,
        subscribeTracks: api.subscribeTracks,
        leaveRoom: api.leaveRoom,
        endRoom: api.endRoom,
        createDataChannel: api.createDataChannel,
      }
    },
  }
}
