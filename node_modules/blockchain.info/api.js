var request = require('request-promise')
var q = require('q')
var urljoin = require('url-join')

function API (rootUrl, endpoints) {
  this.rootUrl = rootUrl
  this.endpoints = endpoints
}

API.prototype.request = function (api, options) {
  try {
    var endpoint = this.endpoints[api].stringify(options)
    var apiurl = urljoin(this.rootUrl, endpoint)
    return request(apiurl).then(parseResponse).catch(handleError)
  } catch (err) {
    return q.reject(err)
  }
}

API.prototype.post = function (api, options, body) {
  try {
    var endpoint = this.endpoints[api].stringify(options)
    var apiurl = urljoin(this.rootUrl, endpoint)
    return request({
      method: 'POST',
      url: apiurl,
      form: body
    }).then(parseResponse).catch(handleError)
  } catch (err) {
    return q.reject(err)
  }
}

module.exports = API

function parseResponse (response) {
  try { return JSON.parse(response) } catch (e) { return response }
}

function handleError (e) {
  throw e.error || e || 'Unexpected error'
}
