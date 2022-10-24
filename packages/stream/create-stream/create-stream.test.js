import nock from 'nock'
import { expect } from 'chai'
import { createStream } from './create-stream.js'
import { Internal } from '../../internal/index.js'
import { init } from '../../app/init/init.js'

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

    it('should return error if initialization instance', async function () {
      try {
        await createStream()
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function'
        )
      }
    })

    it('should return error response if function is called with no config argument or config argument in not object format', async function () {
      try {
        await createStream(
          init({
            api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
          })
        )
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to process because config argument must be input in object format'
        )
      }

      const config = 'tes'
      try {
        await createStream(
          init({
            api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
          }),
          config
        )
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to process because config argument must be input in object format'
        )
      }
    })

    it('should return error response if function is called with no stream name argument', async function () {
      const config = {}
      try {
        await createStream(
          init({
            api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
          }),
          config
        )
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('Error')
        expect(error.message).to.be.equal(
          'Failed to create a new stream because the name of the stream is empty. Please provide a stream name'
        )
      }
    })

    it('should return error response if function is called with stream name with not a string type', async function () {
      const config = { name: 2 }
      try {
        await createStream(
          init({
            api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
          }),
          config
        )
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to create a new stream because the name of the stream is not in string format. A stream name must be in string format'
        )
      }
    })

    it('should return error response if function is called with stream slug with not a string type', async function () {
      const config = { name: 'shopping', slug: 2 }
      try {
        await createStream(
          init({
            api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
          }),
          config
        )
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('Error')
        expect(error.message).to.be.equal(
          'Failed to create a new stream because the slug of the stream is not in string format. A slug must be in string format'
        )
      }
    })

    it('should return error response if function is called with stream description with not a string type', async function () {
      const config = { name: 'shopping', slug: 'shopping', description: 2 }
      try {
        await createStream(
          init({
            api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
          }),
          config
        )
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

      const config = { name: 'shopping' }
      try {
        await createStream(
          init({
            api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
          }),
          config
        )
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

      const config = { name: 'shopping' }
      try {
        await createStream(
          init({
            api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
          }),
          config
        )
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
    const config = { name: 'tes', slug: 'tes', description: 'tes' }
    beforeEach(function () {
      nock(`${Internal.config.api.base_url}`)
        .post(`/${Internal.config.api.version}/streams/create`, config)
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
            startTime: null,
            endTime: null,
            billingStart: null,
            billingEnd: null,
            preparedAt: null,
            hlsManifestPath: '',
            dashManifestPath: '',
            description: '',
            createdBy: 6,
            createdAt: '2022-09-05T07:38:09.525329768Z',
            updatedBy: null,
            updatedAt: '2022-09-05T07:38:09.525329768Z',
            quality: '360',
          },
        })
    })

    afterEach(function () {
      return nock.cleanAll()
    })

    it('should return code 200', async function () {
      const result = await createStream(
        init({
          api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
        }),
        config
      )

      expect(result.status.code).to.equal(200)
    })

    it('should return success response data', async function () {
      const result = await createStream(
        init({
          api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
        }),
        config
      )

      expect(result).to.be.an('object')
      expect(result).to.have.property('status').to.be.an('object')
      expect(result).to.have.property('data').to.be.an('object')
      expect(result.data).to.have.property('id').to.be.a('number')
      expect(result.data).to.have.property('name').to.be.a('string').to.not.be
        .empty
      expect(result.data).to.have.property('slug').to.be.a('string')
      expect(result.data).to.have.property('description').to.be.a('string')
      expect(result.data).to.have.property('startTime').to.be.null
      expect(result.data).to.have.property('endTime').to.be.null
      expect(result.data).to.have.property('billingStart').to.be.null
      expect(result.data).to.have.property('billingEnd').to.be.null
      expect(result.data).to.have.property('preparedAt').to.be.null
      expect(result.data).to.have.property('hlsManifestPath').to.be.a('string')
        .to.be.empty
      expect(result.data).to.have.property('dashManifestPath').to.be.a('string')
        .to.be.empty
      expect(result.data).to.have.property('createdAt').to.be.a('string').to.not
        .be.empty
      expect(result.data).to.have.property('updatedAt').to.be.a('string').to.not
        .be.empty
      expect(result.data).to.have.property('quality').to.be.a('string').to.not
        .be.empty
      expect(result.data).to.not.have.property('viewerCount')
    })
  })
})
