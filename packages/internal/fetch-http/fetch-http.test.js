import { expect } from 'chai'
import { fetchHttp } from './fetch-http.js'

describe('Test cases for the fetchHttp() function', function () {
  describe('Basic test', function () {
    it('should be a function', function () {
      expect(fetchHttp).to.be.a('function')
    })
  })
})
