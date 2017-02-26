var API = require('../api')
var UrlPattern = require('url-pattern')

var endpoints = {
  pushtx: new UrlPattern('/pushtx')
}

var api = new API('https://blockchain.info', endpoints)

module.exports = {
  pushtx: pushtx
}

function pushtx (txHex, options) {
  options = options || {}
  var body = { tx: txHex, api_code: options.apiCode }
  return api.post('pushtx', {}, body)
}
