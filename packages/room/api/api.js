/**
 * @typedef {RoomAPIType.ApiDependencies} ApiDependencies
 */

/** @param {ApiDependencies} apiDeps Dependencies for api module */
export const createApi = ({ fetcher }) => {
  const Api = class {
    _fetcher

    constructor() {
      this._fetcher = fetcher
    }

    /**
     * @param {string} [name]
     */
    createRoom = async (name = '') => {
      /** @type {RoomAPIType.CreateRoomResponseBody} */
      const response = await this._fetcher.post(`/rooms/create`, {
        body: JSON.stringify({ name: name }),
      })

      const data = response.data || {}

      const room = {
        code: response.code || 500,
        ok: response.ok || false,
        data: {
          roomId: data.id || '',
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

      /** @type {RoomAPIType.GetRoomResponseBody} */
      const response = await this._fetcher.get(`/rooms/${roomId}`)

      const data = response.data || {}

      const room = {
        code: response.code || 500,
        ok: response.ok || false,
        data: {
          roomId: data.id || '',
          roomName: data.name || '',
        },
      }

      return room
    }

    /**
     * @param {string} roomId
     * @param {string} [clientId]
     */
    registerClient = async (roomId, clientId = '') => {
      if (typeof roomId !== 'string' || roomId.trim().length === 0) {
        throw new Error('Room ID must be a valid string')
      }

      if (typeof clientId !== 'string') {
        throw new TypeError('Client ID must be a valid string')
      }

      const body = clientId.trim().length > 0 ? { uid: clientId } : {}

      /** @type {RoomAPIType.RegisterClientResponseBody} */
      const response = await this._fetcher.post(`/rooms/${roomId}/register`, {
        body: JSON.stringify(body),
      })

      const data = response.data || {}

      const client = {
        code: response.code || 500,
        ok: response.ok || false,
        data: {
          clientId: data.client_id || '',
        },
      }

      return client
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

      /** @type {RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.post(
        `/rooms/${roomId}/candidate/${clientId}`,
        { body: JSON.stringify(candidate.toJSON()) }
      )

      const result = {
        code: response.code || 500,
        ok: response.ok || false,
        data: response.data || null,
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

      /** @type {RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.post(
        `/rooms/${roomId}/isallownegotiate/${clientId}`
      )

      const result = {
        code: response.code || 500,
        ok: response.ok || false,
        data: response.data || null,
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

      /** @type {RoomAPIType.NegotiateConnectionResponseBody} */
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
        data: {
          answer: data.answer,
        },
      }

      return result
    }

    /**
     * @param {string} roomId
     * @param {string} clientId
     * @param {RoomAPIType.TrackSourcesRequestBody[]} trackSources
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

      /** @type {RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.put(
        `/rooms/${roomId}/settracksources/${clientId}`,
        {
          body: JSON.stringify(trackSources),
        }
      )

      const result = {
        code: response.code || 500,
        ok: response.ok || false,
        data: response.data || null,
      }

      return result
    }

    /**
     * @param {string} roomId
     * @param {string} clientId
     * @param {RoomAPIType.SubscribeTracksRequestBody[]} subscribeTracks
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

      /** @type {RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.post(
        `/rooms/${roomId}/subscribetracks/${clientId}`,
        {
          body: JSON.stringify(subscribeTracks),
        }
      )

      const result = {
        code: response.code || 500,
        ok: response.ok || false,
        data: response.data || null,
      }

      return result
    }

    /**
     * @param {string} roomId
     * @param {string} clientId
     */
    leaveRoom = async (roomId, clientId) => {
      if (!roomId || !clientId) {
        throw new Error('Room ID, and client ID are required')
      }

      /** @type {RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.delete(
        `/rooms/${roomId}/leave/${clientId}`,
        {
          keepalive: true,
        }
      )

      const result = {
        code: response.code || 500,
        ok: response.ok || false,
        data: response.data || null,
      }

      return result
    }

    /**
     * @param {string} roomId
     */
    terminateRoom = async (roomId) => {
      if (typeof roomId !== 'string' || roomId.trim().length === 0) {
        throw new Error('Room ID must be a valid string')
      }

      /** @type {RoomAPIType.BaseResponseBody} */
      const response = await this._fetcher.put(`/rooms/${roomId}/end`)

      const result = {
        code: response.code || 500,
        ok: response.ok || false,
        data: response.data || null,
      }

      return result
    }
  }

  return {
    createInstance: () => {
      const api = new Api()

      return {
        createRoom: api.createRoom,
        getRoom: api.getRoom,
        registerClient: api.registerClient,
        sendIceCandidate: api.sendIceCandidate,
        checkNegotiateAllowed: api.checkNegotiateAllowed,
        negotiateConnection: api.negotiateConnection,
        setTrackSources: api.setTrackSources,
        subscribeTracks: api.subscribeTracks,
        leaveRoom: api.leaveRoom,
        terminateRoom: api.terminateRoom,
      }
    },
  }
}
