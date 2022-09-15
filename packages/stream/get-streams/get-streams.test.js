import { expect } from 'chai'
import nock from 'nock'
import { getStreams } from './get-streams.js'
import { Internal } from '../../internal/index.js'

describe('Get Streams Module', function () {
  describe('Basic test', function () {
    it('should be a function', function () {
      expect(getStreams).to.be.a('function')
    })
  })

  describe('Negative test', function () {
    it('should return error response if API key is not valid', async function () {
      nock(`${Internal.config.api.base_url}`)
        .get(`/${Internal.config.api.version}/streams/`)
        .reply(403, { code: 403, message: 'API key is not valid', data: '' })

      try {
        await getStreams()
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
              hls_manifest_path: '',
              dash_manifest_path: '',
              description: '',
              created_by: 6,
              created_at: '2022-09-05T07:38:09.525329768Z',
              updated_at: '2022-09-05T07:38:09.525329768Z',
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
      const result = await getStreams()
      // console.log(result)

      expect(result.status.code).to.equal(200)
    })

    it('should return success response data', async function () {
      const result = await getStreams()

      expect(result).to.be.an('object')
      expect(result).to.have.property('data').to.be.an('array')
      for (let p of result.data) {
        expect(p).to.have.own.property('id').that.is.a('number')
        expect(p).to.have.own.property('name').that.is.a('string')
        expect(p).to.have.own.property('slug').that.is.a('string')
        expect(p).to.have.own.property('hls_manifest_path').that.is.a('string')
        expect(p).to.have.own.property('dash_manifest_path').that.is.a('string')
      }
    })
  })

  // it('should return error if the /streams endpoint returns 403', async function () {
  //   nock('https://api.inlive.app')
  //     .get('/v1/streams/')
  //     .reply(403, { code: 403, message: 'API key is not valid', data: '' })
  //   const result = await getStreams()
  //   console.log('res', result)

  //   expect(result.status.code).to.equal(403)
  //   expect(result).to.have.property('data').to.be.a('null')
  // })
})