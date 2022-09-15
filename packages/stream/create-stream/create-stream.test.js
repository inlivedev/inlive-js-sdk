import { expect } from 'chai'
import { createStream } from './create-stream.js'
import { Internal } from '../../internal/index.js'
import nock from 'nock'

describe('Create Stream Module', function () {
  describe('Basic test', function () {
    it('should be a function', function () {
      expect(createStream).to.be.a('function')
    })
  })

  describe('Negative test', function () {
    afterEach(function () {
      return nock.cleanAll()
    })

    it('should return error response if function is called with no stream name argument', async function () {
      try {
        await createStream()
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('Error')
        expect(error.message).to.be.equal(
          'Failed to create a new stream because the name of the stream is empty. Please provide a stream name'
        )
      }
    })

    it('should return error response if function is called with stream name with not a string type', async function () {
      try {
        await createStream(2)
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to create a new stream because the name of the stream is not in string format. A stream name must be in string format'
        )
      }
    })

    it('should return error response if function is called with stream slug with not a string type', async function () {
      try {
        await createStream('shopping', 2)
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('Error')
        expect(error.message).to.be.equal(
          'Failed to create a new stream because the slug of the stream is not in string format. A slug must be in string format'
        )
      }
    })
    it('should return error response if function is called with stream description with not a string type', async function () {
      try {
        await createStream('shopping', 'shopping', {})
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('Error')
        expect(error.message).to.be.equal(
          'Failed to create a new stream because the description of the stream is not in string format. A description must be in string format'
        )
      }
    })
    it('should return error response if API Key is not valid', async function () {
      nock(`${Internal.config.api.base_url}`)
        .post(`/${Internal.config.api.version}/streams/create`, {
          name: 'tes',
          slug: 'tes',
          description: 'tes',
        })
        .reply(403, { code: 403, message: 'API Key is not valid', data: '' })
      try {
        await createStream('tes')
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('Error')
        expect(error.message).to.be.equal(
          'Failed to create a new stream because the API Key is not valid. Please provide a valid and active API Key.'
        )
      }
    })
    it('should return error response if unexpected error from server', async function () {
      nock(`${Internal.config.api.base_url}`)
        .post(`/${Internal.config.api.version}/streams/create`, {
          name: 'tes',
          slug: 'tes',
          description: 'tes',
        })
        .reply(500, { code: 500, message: 'Server error', data: '' })

      try {
        await createStream('tes')
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('Error')
        expect(error.message).to.be.equal(
          'Failed to create a new stream because unexpected error from the server'
        )
      }
    })
  })

  describe('Positive test', function () {
    beforeEach(function () {
      nock(`${Internal.config.api.base_url}`)
        .post(`/${Internal.config.api.version}/streams/create`, {
          name: 'tes',
          slug: 'tes',
          description: 'tes',
        })
        .reply(200, {
          status: {
            code: 200,
            message: 'Success',
            type: 'success',
          },
          data: {
            id: 371,
            name: 'a new stream',
            slug: '',
            hls_manifest_path: '',
            dash_manifest_path: '',
            description: '',
            created_by: 6,
            created_at: '2022-09-05T07:38:09.525329768Z',
            updated_at: '2022-09-05T07:38:09.525329768Z',
            quality: '360',
          },
        })
    })

    afterEach(function () {
      return nock.cleanAll()
    })

    it('should return code 200', async function () {
      const result = await createStream('tes', 'tes', 'tes')
      // console.log(result)

      expect(result.status.code).to.equal(200)
    })

    it('should return success response', async function () {
      const result = await createStream('tes', 'tes', 'tes')

      expect(result).to.be.an('object')
      expect(result).to.have.property('status').to.be.an('object')
      expect(result).to.have.property('data').to.be.an('object')
      expect(result.data).to.have.property('id')
      expect(result.data).to.have.property('name').to.be.a('string')
      expect(result.data).to.have.property('slug').to.be.a('string')
      expect(result.data).to.have.property('description').to.be.a('string')
    })
  })

  // it('tes', async function () {
  //   const result = await createStream('tes01')
  //   console.log('res', result)
  // })
})
