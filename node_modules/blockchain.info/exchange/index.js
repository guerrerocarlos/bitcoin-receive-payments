var API = require('../api')
var UrlPattern = require('url-pattern')

var endpoints = {
  ticker: new UrlPattern('/ticker(?api_code=:apiCode)'),
  frombtc: new UrlPattern('/frombtc?value=:value&time=:time&currency=:currency(&api_code=:apiCode)'),
  tobtc: new UrlPattern('/tobtc?value=:value&currency=:currency(&api_code=:apiCode)')
}

var api = new API('https://blockchain.info', endpoints)

module.exports = {
  getTicker: getTicker,
  fromBTC: fromBTC,
  toBTC: toBTC
}

function getTicker (options) {
  options = options || {}
  return api.request('ticker', { apiCode: options.apiCode })
    .then(function (data) { return data[options.currency] || data })
}

function fromBTC (amount, currency, options) {
  options = options || {}
  return api.request('frombtc', { value: amount, time: options.time || 0, currency: currency, apiCode: options.apiCode })
    .then(function (value) { return parseFloat(value) })
}

function toBTC (amount, currency, options) {
  options = options || {}
  return api.request('tobtc', { value: amount, currency: currency, apiCode: options.apiCode })
    .then(function (amount) { return amount.replace(',', '') })
}
