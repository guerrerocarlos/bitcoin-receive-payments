var Block = require('bitcoinjs-lib').Block
var EventEmitter = require('events')
var inherits = require('util').inherits
var pseudoRandomBytes = require('crypto').pseudoRandomBytes
var u = require('bitcoin-util')

function MockPeer () {
  EventEmitter.call(this)
  this.latency = 0
}
exports.MockPeer = MockPeer
inherits(MockPeer, EventEmitter)
MockPeer.prototype.send = function (command, payload) {
  this.emit('send:' + command, payload)
}
MockPeer.prototype.getBlocks = function (hashes, opts, cb) {
  var self = this
  setImmediate(function () {
    cb(null, hashes.map(function (hash) {
      return { transactions: [] }
    }), self)
  })
}
MockPeer.prototype.getTransactions = function (hashes, cb) {
  this.emit('getTransactions', hashes, cb)
}
MockPeer.prototype.getHeaders = function (locator, opts, cb) {
  this.emit('getHeaders', locator, opts, cb)
}

exports.createBlock = function (prev) {
  var header = new Block()
  header.version = 2
  header.merkleRoot = u.nullHash
  header.timestamp = Math.floor(Date.now() / 1000)
  header.bits = 0xff000000
  header.nonce = Math.floor(Math.random() * 0xffffffff)
  header.prevHash = prev ? prev.header.getHash() : u.nullHash
  return {
    height: prev ? prev.height + 1 : 0,
    header: header
  }
}

exports.createTx = function (hash) {
  hash = hash || pseudoRandomBytes(32)
  return { getHash: function () { return hash } }
}
