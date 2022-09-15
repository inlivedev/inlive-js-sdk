import { expect } from 'chai'
import { getStream } from './get-stream.js'
import { Internal } from '../../internal/index.js'
import nock from 'nock'

describe('Get Stream Module', function () {
  describe('Basic test', function () {
    it('should be a function', function () {
      expect(getStream).to.be.a('function')
    })
  })

  describe('Negative test', function () {
    it('should return error response if function is called with no stream ID argument', async function () {
      try {
        await getStream()
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
        await getStream('1')
      } catch (error) {
        expect(error).to.be.an('error')
        expect(error.name).to.be.equal('TypeError')
        expect(error.message).to.be.equal(
          'Failed to get the stream data because the stream ID is not type of number. Please provide a valid stream ID'
        )
      }
    })

    it('should return error response if stream ID not found', async function () {
      let stream_id = 1000
      nock(`${Internal.config.api.base_url}`)
        .get(`/${Internal.config.api.version}/streams/${stream_id}`)
        .reply(404, { code: 404, message: 'ID not found', data: '' })

      try {
        await getStream(stream_id)
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
      const result = await getStream(stream_id)
      // console.log(result)

      expect(result.status.code).to.equal(200)
    })

    it('should return success response', async function () {
      const result = await getStream(stream_id)

      expect(result).to.be.an('object')
      expect(result).to.have.property('status').to.be.an('object')
      expect(result).to.have.property('data').to.be.an('object')
      expect(result.data).to.have.property('id').to.be.equal(stream_id)
      expect(result.data).to.have.property('name')
      expect(result.data).to.have.property('slug')
      expect(result.data).to.have.property('hls_manifest_path')
      expect(result.data).to.have.property('dash_manifest_path')
    })
  })

  // msh ragu cara cek part id ini
  // it('stream id should be a number', async function () {
  //   const STREAM_ID = 1
  //   expect(STREAM_ID).to.be.a('number')
  //   expect(STREAM_ID % 1).to.equal(0)
  // })

  // it('should return as an object & has properties of status & data', async function () {
  //   const result = await getStream(351)

  //   if (result !== undefined) {
  //     expect(result).to.be.an('object')
  //     expect(result).to.have.property('status')
  //     expect(result).to.have.property('data')
  //   }
  // })

  // it('if success will return data of an object, if error will return data of null', async function () {
  //   let id = 351
  //   const result = await getStream(id)
  //   const data = result.data

  //   if (result?.status?.code === 200) {
  //     expect(data).to.be.an('object')
  //     expect(data).to.have.property('id').to.be.equal(id)
  //     expect(data).to.have.property('name')
  //     expect(data).to.have.property('slug')
  //     expect(data).to.have.property('hls_manifest_path')
  //     expect(data).to.have.property('dash_manifest_path')
  //   } else {
  //     expect(data).to.be.a('null')
  //   }
  // })
})
