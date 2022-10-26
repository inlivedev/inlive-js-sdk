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

    it('should throws an error when the init() function is called with the apiKey field is missing', function () {
      expect(() => init({ key: 'any key' })).to.throw(
        Error,
        'Failed to process because the API key is not provided. Please provide an API key.'
      )
    })

    it('should throws an error when the value of the apiKey field is not a string', function () {
      expect(() => init({ apiKey: undefined })).to.throw(
        Error,
        'Failed to process because the API key is not provided. Please provide an API key.'
      )
      expect(() => init({ apiKey: 0 })).to.throw(
        TypeError,
        'Failed to process because the API key is not in a valid string format. API key must be in a string format'
      )
      expect(() => init({ apiKey: false })).to.throw(
        TypeError,
        'Failed to process because the API key is not in a valid string format. API key must be in a string format'
      )
      expect(() => init({ apiKey: Number.NaN })).to.throw(
        TypeError,
        'Failed to process because the API key is not in a valid string format. API key must be in a string format'
      )
    })

    it('should throws an error when the apiKey field is empty string', function () {
      expect(() => init({ apiKey: '' })).to.throw(
        Error,
        'Failed to process because the API key field is an empty string. Please provide an API key.'
      )
      expect(() => init({ apiKey: '   ' })).to.throw(
        Error,
        'Failed to process because the API key field is an empty string. Please provide an API key.'
      )
    })
  })

  describe('Positive test', function () {
    it('should returns a success response with api key data inside the object', function () {
      expect(init({ apiKey: 'any api key' })).to.be.an('object')
      expect(init({ apiKey: 'any api key' })).to.have.property('config')
      expect(init({ apiKey: 'any api key' })).to.have.deep.nested.property(
        'config.apiKey'
      )
    })
  })
})
