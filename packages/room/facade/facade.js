import merge from 'lodash-es/merge.js'
import { createFetcher } from '../api/fetcher.js'
import { createApi } from '../api/api.js'
import * as defaultConfig from '../config/config.js'

const config = {
  api: defaultConfig.api,
  webrtc: defaultConfig.webrtc,
}

/** @param {import('./facade-types.js').RoomFacadeType.FacadeDependencies} facadeDependencies Dependencies for facade module */
export const createFacade = ({ config, api: { createFetcher, createApi } }) => {
  return {
    /**
     * @param {import('../room-types.js').RoomType.UserConfig} userConfig
     */
    createInstance: (userConfig) => {
      merge(config, userConfig)

      const baseUrl = `${config.api.baseUrl}/${config.api.version}`
      const fetcher = createFetcher().createInstance(baseUrl)
      const api = createApi({
        fetcher,
      }).createInstance()

      return {
        createRoom: api.createRoom,
        createClient: api.registerClient,
        getRoom: api.getRoom,
        leaveRoom: api.leaveRoom,
        endRoom: api.endRoom,
      }
    },
  }
}

export const facade = createFacade({
  config,
  api: { createFetcher, createApi },
})
