var statistics = require('./index')
var nock = require('nock')
var expect = require('chai').expect

describe('statistics', function () {
  describe('.get()', function () {
    nock('https://blockchain.info')
      .get('/stats').query(true).times(3)
      .reply(200, { market_price_usd: 999.99 })

    it('should get a list of stats', function (done) {
      statistics.get()
        .then(function (data) {
          expect(data.market_price_usd).to.equal(999.99)
          done()
        })
        .catch(done)
    })

    it('should get a single stat if specified', function (done) {
      statistics.get({ stat: 'market_price_usd' })
        .then(function (data) {
          expect(data).to.equal(999.99)
          done()
        })
        .catch(done)
    })

    it('should reject a nonexistant stat', function (done) {
      statistics.get({ stat: 'satoshis_coords' })
        .then(done)
        .catch(function (err) {
          expect(err).to.equal('Received unknown stat option')
          done()
        })
    })
  })

  describe('.getChartData()', function () {
    var chartData = [
      { x: 100, y: 4 },
      { x: 101, y: 8 }
    ]

    nock('https://blockchain.info')
      .get('/charts/market-cap').query(true)
      .reply(200, { values: chartData })

    it('should get a list of chart points', function (done) {
      statistics.getChartData('market-cap')
        .then(function (data) {
          expect(data).to.deep.equal(chartData)
          done()
        })
        .catch(done)
    })
  })

  describe('.getPoolData()', function () {
    var poolData = {
      'BitFury': 58,
      'AntPool': 87
    }

    it('should get pool data', function (done) {
      nock('https://blockchain.info')
        .get('/pools?format=json')
        .reply(200, poolData)

      statistics.getPoolData()
        .then(function (data) {
          expect(data).to.deep.equal(poolData)
          done()
        })
        .catch(done)
    })

    it('should get pool data with optional timespan', function (done) {
      nock('https://blockchain.info')
        .get('/pools?format=json&timespan=8days')
        .reply(200, poolData)

      statistics.getPoolData({ timespan: 8 })
        .then(function (data) {
          expect(data).to.deep.equal(poolData)
          done()
        })
        .catch(done)
    })
  })
})
