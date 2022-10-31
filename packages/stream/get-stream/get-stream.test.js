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
    it('should return type error response if function is called with no init object', async function () {
      try {
        await getStream()
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
            apiKey: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
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
            apiKey: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
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
            apiKey: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
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
            apiKey: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
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
      let streamId = 1000
      nock(`${Internal.config.api.baseUrl}`)
        .get(`/${Internal.config.api.version}/streams/${streamId}`)
        .reply(404, { code: 404, message: 'ID not found', data: '' })

      try {
        await getStream(
          init({
            apiKey: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
          }),
          streamId
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
    let streamId = 351
    beforeEach(function () {
      nock(`${Internal.config.api.baseUrl}`)
        .get(`/${Internal.config.api.version}/streams/${streamId}`)
        .reply(200, {
          status: {
            code: 200,
            message: 'Success',
            type: 'success',
          },
          data: {
            id: streamId,
            name: 'a new stream',
            slug: '',
            startTime: '2022-09-06T02:11:39.954264Z',
            endTime: '2022-09-06T02:38:50.746014Z',
            billingStart: '2022-09-06T02:10:49.746014Z',
            billingEnd: '2022-09-06T02:38:50.746014Z',
            preparedAt: '2022-09-06T02:10:49.746014Z',
            hlsManifestPath:
              'https://bifrost.inlive.app/streams/351/master.m3u8',
            dashManifestPath:
              'https://bifrost.inlive.app/streams/351/manifest.mpd',
            description: '',
            createdBy: 6,
            createdAt: '2022-09-05T07:38:09.525329768Z',
            updatedBy: null,
            updatedAt: '2022-09-06T02:38:50.746014Z',
            quality: '360',
            viewerCount: 0,
          },
        })
    })

    afterEach(function () {
      return nock.cleanAll()
    })

    it('should call the getStream function', async function () {
      const result = await getStream(
        init({
          apiKey: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
        }),
        streamId
      )
      expect(result.status.code).to.equal(200)
    })

    it('should return success response', async function () {
      const result = await getStream(
        init({
          apiKey: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
        }),
        streamId
      )

      expect(result).to.be.an('object')
      expect(result).to.have.property('status').to.be.an('object')
      expect(result).to.have.property('data').to.be.an('object')
      expect(result.data).to.have.property('id').to.be.equal(streamId)
      expect(result.data).to.have.property('name').to.be.a('string').to.not.be
        .empty
      expect(result.data).to.have.property('slug').to.be.a('string')
      expect(result.data).to.have.property('description').to.be.a('string')
      expect(result.data).to.have.property('startTime').to.be.a('string').to.not
        .be.empty
      expect(result.data).to.have.property('endTime').to.be.a('string').to.not
        .be.empty
      expect(result.data).to.have.property('billingStart').to.be.a('string').to
        .not.be.empty
      expect(result.data).to.have.property('billingEnd').to.be.a('string').to
        .not.be.empty
      expect(result.data).to.have.property('preparedAt').to.be.a('string').to
        .not.be.empty
      expect(result.data).to.have.property('hlsManifestPath').to.be.a('string')
        .to.not.be.empty
      expect(result.data).to.have.property('dashManifestPath').to.be.a('string')
        .to.not.be.empty
      expect(result.data).to.have.property('createdAt').to.be.a('string').to.not
        .be.empty
      expect(result.data).to.have.property('updatedAt').to.be.a('string').to.not
        .be.empty
      expect(result.data).to.have.property('quality').to.be.a('string').to.not
        .be.empty
      expect(result.data).to.have.property('viewerCount').to.be.a('number')
    })
  })
})
