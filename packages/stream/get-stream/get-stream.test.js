import nock from 'nock'
import { expect } from 'chai'
import { getStream } from './get-stream.js'
import { Internal } from '../../internal/index.js'
import { init } from '../../app/init/init.js'

describe('Get Stream Module', function () {
  describe('Basic test', function () {
    it('should be a function', function () {
      expect(getStream).to.be.a('function')
    })
  })

  describe('Negative test', function () {
    it('should return error if initialization instance not input / not match format', async function () {
      try {
        await getStream()
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function'
        )
      }

      try {
        await getStream({})
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function'
        )
      }

      try {
        await getStream('blabla')
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function'
        )
      }

      try {
        await getStream({ tes: 'blabla' })
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function'
        )
      }
    })

    it('should return error response if function is called with no stream ID argument', async function () {
      try {
        await getStream(
          init({
            api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
          })
        )
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('Error')
        expect(error.message).to.be.equal(
          'Failed to get the stream data because the stream ID is empty. Please provide a stream ID'
        )
      }
    })

    it('should return error response if function is called with stream ID with not a number type', async function () {
      try {
        await getStream(
          init({
            api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
          }),
          '1'
        )
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to get the stream data because the stream ID is not in number format. A stream ID must be number format'
        )
      }

      try {
        await getStream(
          init({
            api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
          }),
          {}
        )
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to get the stream data because the stream ID is not in number format. A stream ID must be number format'
        )
      }

      try {
        await getStream(
          init({
            api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
          }),
          []
        )
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to get the stream data because the stream ID is not in number format. A stream ID must be number format'
        )
      }
    })

    it('should return error response if stream ID not found', async function () {
      let stream_id = 1000
      nock(`${Internal.config.api.base_url}`)
        .get(`/${Internal.config.api.version}/streams/${stream_id}`)
        .reply(404, { code: 404, message: 'ID not found', data: '' })

      try {
        await getStream(
          init({
            api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
          }),
          stream_id
        )
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('Error')
        expect(error.message).to.be.equal(
          'Failed to get the stream data because the stream ID is not found. Please provide a valid stream ID.'
        )
      }
    })
  })

  describe('Positive test', function () {
    let stream_id = 351
    beforeEach(function () {
      nock(`${Internal.config.api.base_url}`)
        .get(`/${Internal.config.api.version}/streams/${stream_id}`)
        .reply(200, {
          status: {
            code: 200,
            message: 'Success',
            type: 'success',
          },
          data: {
            id: stream_id,
            name: 'a new stream',
            slug: '',
            hls_manifest_path: '',
            dash_manifest_path: '',
            description: '',
            created_by: 6,
            created_at: '2022-09-05T07:38:09.525329768Z',
            updated_at: '2022-09-05T07:38:09.525329768Z',
            quality: '360',
            viewer_count: 0,
          },
        })
    })

    afterEach(function () {
      return nock.cleanAll()
    })

    it('should call the getStream function', async function () {
      const result = await getStream(
        init({
          api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
        }),
        stream_id
      )
      // console.log(result)

      expect(result.status.code).to.equal(200)
    })

    it('should return success response', async function () {
      const result = await getStream(
        init({
          api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
        }),
        stream_id
      )

      expect(result).to.be.an('object')
      expect(result).to.have.property('status').to.be.an('object')
      expect(result).to.have.property('data').to.be.an('object')
      expect(result.data).to.have.property('id').to.be.equal(stream_id)
      expect(result.data).to.have.property('name').to.be.a('string')
      expect(result.data).to.have.property('slug').to.be.a('string')
      expect(result.data)
        .to.have.property('hls_manifest_path')
        .to.be.a('string')
      expect(result.data)
        .to.have.property('dash_manifest_path')
        .to.be.a('string')
    })
  })
})
