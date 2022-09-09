type Options = {
  apiKey: string
}

type SuccessResponses = {
  options: {
    api_key: string
  }
  name: string
}

type ErrorResponses = {
  status: {
    message: string
    type: 'success' | 'error'
  }
}

/**
 * Initialize an inLive App instance
 *
 * @type {Options}
 */
export declare function init({
  apiKey,
}: Options): SuccessResponses | ErrorResponses
