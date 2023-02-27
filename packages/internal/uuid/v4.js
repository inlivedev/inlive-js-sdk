/**
 * Generate a v4 UUID using a cryptographically secure random number generator
 *
 * @returns {string} v4 UUID - Returns a v4 UUID string
 */
const uuidv4 = () => {
  let uuid = ''

  if (window && typeof window !== 'undefined') {
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
     */
    if (crypto.randomUUID) {
      uuid = crypto.randomUUID()
    } else {
      /**
       * @see https://stackoverflow.com/a/2117523
       */
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      uuid = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (
          c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
      )
    }
  }

  return uuid
}

export { uuidv4 }
