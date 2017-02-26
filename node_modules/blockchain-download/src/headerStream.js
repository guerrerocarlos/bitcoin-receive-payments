var Transform = require('stream').Transform
var util = require('util')
var debug = require('debug')('blockchain-download:headerstream')
var INV = require('bitcoin-protocol').constants.inventory

var HeaderStream = module.exports = function (peers, opts) {
  if (!peers) {
    throw new Error('"peers" argument is required for HeaderStream')
  }
  if (!(this instanceof HeaderStream)) {
    return new HeaderStream(peers, opts)
  }
  Transform.call(this, { objectMode: true })
  opts = opts || {}
  this.peers = peers
  this.timeout = opts.timeout
  this.stop = opts.stop
  this.lookAhead = opts.lookAhead != null ? opts.lookAhead : true
  this.done = false
  this.reachedTip = false
  this.lastLocator = null
  this.lookAheadHash = null
  this.lookAheadHeaders = null
  this.lookAheadPeer = null
  if (opts.endOnTip) {
    this.once('tip', () => this.end())
  }
}
util.inherits(HeaderStream, Transform)

HeaderStream.prototype._error = function (err) {
  this.emit('error', err)
}

HeaderStream.prototype._transform = function (locator, enc, cb) {
  this.lastLocator = locator
  if (this.reachedTip) return cb(null)
  if (this.lookAheadHeaders &&
  this.lookAheadHeaders[0].prevHash.equals(locator[0])) {
    // we already looked up next blocks, return them to handler
    var headers = this.lookAheadHeaders
    this.lookAheadHeaders = null
    this._onHeaders(headers, this.lookAheadPeer, cb)
    return
  }
  if (this.lookAheadHash) {
    // inflight lookahead request
    if (this.lookAheadHash.equals(locator[0])) {
      // previous request was validated, inflight request is correct
      this.once(`lookahead:${this.lookAheadHash.toString('base64')}`, (headers, peer) => {
        this._onHeaders(headers, peer, cb)
      })
      return
    } else {
      // previous blocks were invalid, lookahead should be ignored
      this.lookAheadHash = null
    }
  }
  this._getHeaders(locator, (err, headers, peer) => {
    if (err) return this._error(err)
    this._onHeaders(headers, peer, cb)
  })
}

HeaderStream.prototype._getHeaders = function (locator, peer, cb) {
  if (this.done) return
  if (typeof peer === 'function') {
    cb = peer
    peer = null
  }
  peer = peer || this.peers
  peer.getHeaders(locator, {
    stop: this.stop,
    timeout: this.timeout
  }, cb)
}

HeaderStream.prototype._onHeaders = function (headers, peer, cb) {
  if (this.done) return cb(null)
  if (headers.length === 0) {
    this._onTip(peer)
    if (cb) cb(null)
    return
  }
  headers.peer = peer
  this.push(headers)
  if (headers.length < 2000) {
    this._onTip(peer)
    if (cb) cb(null)
    return
  }
  var lastHash = headers[headers.length - 1].getHash()
  if (this.stop && lastHash.compare(this.stop) === 0) {
    this.end()
  }
  if (this.lookAhead) {
    this.lookAheadHash = lastHash
    this._getHeaders([ lastHash ], (err, headers, peer) => {
      this.lookAheadHash = null
      if (err) return this._error(err)
      this.lookAheadHeaders = headers
      this.lookAheadPeer = peer
      this.emit(`lookahead:${lastHash.toString('base64')}`, headers, peer)
    })
  }
  if (cb) cb(null)
}

HeaderStream.prototype.end = function () {
  if (this.done) return
  this.done = true
  Transform.prototype.end.call(this)
}

HeaderStream.prototype._onTip = function (peer) {
  if (this.reachedTip) return
  debug('Reached chain tip, now listening for relayed blocks')
  this.reachedTip = true
  this.emit('tip')
  if (!this.done) this._subscribeToInvs()
}

HeaderStream.prototype._subscribeToInvs = function () {
  var lastSeen = []
  this.peers.on('inv', (inv, peer) => {
    for (let item of inv) {
      if (item.type !== INV.MSG_BLOCK) continue
      for (let hash of lastSeen) {
        if (hash.equals(item.hash)) return
      }
      lastSeen.push(item.hash)
      if (lastSeen.length > 8) lastSeen.shift()
      this._getHeaders(this.lastLocator, peer, (err, headers, peer) => {
        if (err) return this._error(err)
        this._onHeaders(headers, peer, () => {})
      })
    }
  })
}
