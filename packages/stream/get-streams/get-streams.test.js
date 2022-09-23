import nock from 'nock'
import { expect } from 'chai'
import { getStreams } from './get-streams.js'
import { Internal } from '../../internal/index.js'
import { init } from '../../app/init/init.js'

describe('Get Streams Module', function () {
  describe('Basic test', function () {
    it('should be a function', function () {
      expect(getStreams).to.be.a('function')
    })
  })

  describe('Negative test', function () {
    it('should return error if initialization instance not input / not match format', async function () {
      try {
        await getStreams()
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function'
        )
      }

      try {
        await getStreams({})
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function'
        )
      }

      try {
        await getStreams('blabla')
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function'
        )
      }

      try {
        await getStreams({ tes: 'blabla' })
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to process because initialization is not valid. Please provide required initialization argument which is the initialization instance returned by the init() function'
        )
      }
    })

    it('should return error response if API key is not valid', async function () {
      nock(`${Internal.config.api.base_url}`)
        .get(`/${Internal.config.api.version}/streams/`)
        .reply(403, { code: 403, message: 'API key is not valid', data: '' })

      try {
        await getStreams(init({ api_key: 'blabla' }))
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('Error')
        expect(error.message).to.be.equal(
          'Failed to get a list of streams because the API Key is not valid. Please provide a valid and active API Key.'
        )
      }
    })
  })

  describe('Positive test', function () {
    beforeEach(function () {
      nock(`${Internal.config.api.base_url}`)
        .get(`/${Internal.config.api.version}/streams/`)
        .reply(200, {
          status: {
            code: 200,
            message: 'Success',
            type: 'success',
          },
          data: [
            {
              id: 371,
              name: 'a new stream',
              slug: '',
              start_time: '2022-09-06T02:11:39.954264Z',
              end_time: '2022-09-06T02:38:50.746014Z',
              billing_start: '2022-09-06T02:10:49.746014Z',
              billing_end: '2022-09-06T02:38:50.746014Z',
              prepared_at: '2022-09-06T02:10:49.746014Z',
              hls_manifest_path:
                'https://bifrost.inlive.app/streams/351/master.m3u8',
              dash_manifest_path:
                'https://bifrost.inlive.app/streams/351/manifest.mpd',
              description: '',
              created_by: 6,
              created_at: '2022-09-05T07:38:09.525329768Z',
              updated_by: null,
              updated_at: '2022-09-06T02:38:50.746014Z',
              quality: '360',
              viewer_count: 0,
            },
          ],
        })
    })

    afterEach(function () {
      return nock.cleanAll()
    })

    it('should return success response', async function () {
      const result = await getStreams(
        init({
          api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
        })
      )

      expect(result.status.code).to.equal(200)
    })

    it('should return success response data', async function () {
      const result = await getStreams(
        init({
          api_key: 'eyJhbGciOiJ.eyJleHAi.B01hriveOMR',
        })
      )

      expect(result).to.be.an('object')
      expect(result)
        .to.have.deep.property('data', [
          {
            id: 371,
            name: 'a new stream',
            slug: '',
            start_time: '2022-09-06T02:11:39.954264Z',
            end_time: '2022-09-06T02:38:50.746014Z',
            billing_start: '2022-09-06T02:10:49.746014Z',
            billing_end: '2022-09-06T02:38:50.746014Z',
            prepared_at: '2022-09-06T02:10:49.746014Z',
            hls_manifest_path:
              'https://bifrost.inlive.app/streams/351/master.m3u8',
            dash_manifest_path:
              'https://bifrost.inlive.app/streams/351/manifest.mpd',
            description: '',
            created_by: 6,
            created_at: '2022-09-05T07:38:09.525329768Z',
            updated_by: null,
            updated_at: '2022-09-06T02:38:50.746014Z',
            quality: '360',
            viewer_count: 0,
          },
        ])
        .to.be.an('array')
    })
  })
})
