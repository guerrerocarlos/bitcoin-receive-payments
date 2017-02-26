var exchange = require('./index')
var nock = require('nock')
var expect = require('chai').expect

describe('exchange', function () {
  describe('.getTicker()', function () {
    var ticker = {
      USD: {
        '15m': 432.52,
        last: 432.52,
        buy: 432.52,
        sell: 433,
        symbol: '$'
      }
    }

    nock('https://blockchain.info')
      .get('/ticker').times(2)
      .reply(200, ticker)

    it('should get a list of currency rates', function (done) {
      exchange.getTicker()
        .then(function (data) {
          expect(data).to.deep.equal(ticker)
          done()
        })
        .catch(done)
    })

    it('should get a single currency if specified', function (done) {
      exchange.getTicker({ currency: 'USD' })
        .then(function (data) {
          expect(data).to.deep.equal(ticker.USD)
          done()
        })
        .catch(done)
    })
  })

  describe('.fromBTC()', function () {
    nock('https://blockchain.info')
      .get('/frombtc')
      .query(true)
      .reply(200, '227.13')

    it('should convert the currency', function (done) {
      exchange.fromBTC(100000000, 'USD')
        .then(function (response) {
          expect(response).to.equal(227.13)
          done()
        })
        .catch(done)
    })
  })

  describe('.toBTC()', function () {
    nock('https://blockchain.info')
      .get('/tobtc')
      .query(true)
      .reply(200, '1,234.1234')

    it('should convert the currency', function (done) {
      exchange.toBTC(1000, 'USD')
        .then(function (data) {
          expect(data).to.equal('1234.1234')
          done()
        })
        .catch(done)
    })
  })
})
