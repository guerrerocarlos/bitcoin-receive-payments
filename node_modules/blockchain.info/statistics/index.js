var API = require('../api')
var q = require('q')
var UrlPattern = require('url-pattern')

var endpoints = {
  charts: new UrlPattern('/charts/:type?format=json(&api_code=:apiCode)(&timespan=:timespan)'),
  pools: new UrlPattern('/pools?format=json(&timespan=:timespan\\days)(&api_code=:apiCode)'),
  stats: new UrlPattern('/stats?format=json(&api_code=:apiCode)')
}

var api = new API('https://blockchain.info', endpoints)

module.exports = {
  get: get,
  getChartData: getChartData,
  getPoolData: getPoolData
}

function get (options) {
  options = options || {}
  return api
    .request('stats', { apiCode: options.apiCode })
    .then(function (data) {
      data = options.stat ? data[options.stat] : data
      return data || q.reject('Received unknown stat option')
    })
}

function getChartData (chartType, options) {
  options = options || {}
  return api
    .request('charts', { type: chartType, apiCode: options.apiCode, timespan: options.timespan })
    .then(function (data) { return data.values })
}

function getPoolData (options) {
  options = options || {}
  return api
    .request('pools', { apiCode: options.apiCode, timespan: options.timespan })
}
