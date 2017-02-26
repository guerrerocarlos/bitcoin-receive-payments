var API = require('../api')
var parse = require('url-parse')
var UrlPattern = require('url-pattern')

var endpoints = {
  receive: new UrlPattern('/receive?xpub=:xpub&callback=:callback&key=:key')
}

var api = new API('https://api.blockchain.info/v2', endpoints)

function Receive (xpub, callback, key) {
  this.xpub = xpub
  this.callback = callback
  this.key = key
}

Receive.prototype.generate = function (query) {
  var callbackUrl = parse(this.callback).set('query', query).toString()
  var callbackEnc = encodeURIComponent(callbackUrl)
  var params = { xpub: this.xpub, key: this.key, callback: callbackEnc }
  return api.request('receive', params)
}

module.exports = Receive
