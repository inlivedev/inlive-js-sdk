type Options = {
  apiKey: string
}

type InliveAppInstance = {
  options: {
    api_key: string
  }
  name: string
}

type ErrorException = {
  status: {
    message: string
    type: 'error'
  }
}

/**
 * Initialize an inLive App instance
 *
 * @type {Options}
 */
export declare function init({
  apiKey,
}: Options): InliveAppInstance | ErrorException
