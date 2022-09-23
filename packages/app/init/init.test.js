import { expect } from 'chai'
import { init } from './init.js'

describe('Test cases for the init() function', function () {
  describe('Basic test', function () {
    it('should be a function', function () {
      expect(init).to.be.a('function')
    })
  })

  describe('Negative test', function () {
    it('should throws an error when the init() function is called without any argument', function () {
      expect(() => init()).to.throw(
        Error,
        'Failed to process because the API key is not provided. Please provide an API key.'
      )
    })

    it('should throws an error when the init() function is called with an empty object argument', function () {
      expect(() => init({})).to.throw(
        Error,
        'Failed to process because the API key is not provided. Please provide an API key.'
      )
    })

    it('should throws an error when the init() function is called with the api_key field is missing', function () {
      expect(() => init({ key: 'any key' })).to.throw(
        Error,
        'Failed to process because the API key is not provided. Please provide an API key.'
      )
    })

    it('should throws an error when the value of the api_key field is not a string', function () {
      expect(() => init({ api_key: undefined })).to.throw(
        Error,
        'Failed to process because the API key is not provided. Please provide an API key.'
      )
      expect(() => init({ api_key: 0 })).to.throw(
        TypeError,
        'Failed to process because the API key is not in a valid string format. API key must be in a string format'
      )
      expect(() => init({ api_key: false })).to.throw(
        TypeError,
        'Failed to process because the API key is not in a valid string format. API key must be in a string format'
      )
      expect(() => init({ api_key: Number.NaN })).to.throw(
        TypeError,
        'Failed to process because the API key is not in a valid string format. API key must be in a string format'
      )
    })

    it('should throws an error when the api_key field is empty string', function () {
      expect(() => init({ api_key: '' })).to.throw(
        Error,
        'Failed to process because the API key field is an empty string. Please provide an API key.'
      )
      expect(() => init({ api_key: '   ' })).to.throw(
        Error,
        'Failed to process because the API key field is an empty string. Please provide an API key.'
      )
    })
  })

  describe('Positive test', function () {
    it('should returns a success response with api key data inside the object', function () {
      expect(init({ api_key: 'any api key' })).to.be.an('object')
      expect(init({ api_key: 'any api key' })).to.have.property('config')
      expect(init({ api_key: 'any api key' })).to.have.deep.nested.property(
        'config.api_key'
      )
    })
  })
})
