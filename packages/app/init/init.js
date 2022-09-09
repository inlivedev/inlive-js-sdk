const baseOptions = {
  apiKey: '',
}

/**
 * @type {import('./init').init}
 */
const init = (options = baseOptions) => {
  return options.apiKey.trim().length > 0
    ? {
        options: {
          api_key: options.apiKey,
        },
        name: 'default',
      }
    : {
        status: {
          message:
            'Failed to process because the API Key is not provided. Please provide an API Key.',
          type: 'error',
        },
      }
}

export { init }
