import { expect } from 'chai'
import { init } from './init.js'

describe('Testing the init() function', function () {
  context('Test the basic of function', function () {
    it('should be a function', function () {
      expect(init).to.be.a('function')
    })
  })

  context('Test the function without api key argument', function () {
    it('should returns a failed response', function () {
      const failedResponse = {
        status: {
          message:
            'Failed to process because the API Key is not provided. Please provide an API Key.',
          type: 'error',
        },
      }
      expect(init()).to.be.an('object')
      expect(init()).to.deep.equal(failedResponse)
      expect(init({})).to.deep.equal(failedResponse)
    })
  })

  context('Test the function with api key argument', function () {
    it('should returns a success response with api key data inside the object', function () {
      expect(init({ apiKey: 'abc123' })).to.be.an('object')
      expect(init({ apiKey: 'abc123' })).to.deep.equal({
        options: {
          api_key: 'abc123',
        },
        name: 'default',
      })
    })
  })
})
