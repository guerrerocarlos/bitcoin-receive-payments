'use strict'

var EventEmitter = require('events')
var INV = require('bitcoin-protocol').constants.inventory
var MapDeque = require('map-deque')
var old = require('old')
var reverse = require('buffer-reverse')

// TODO: prevent DoS (e.g. rate limiting, cap on stored data)
// TODO: add optional tx verification (user-provided function), and broadcast valid txs

class Inventory extends EventEmitter {
  constructor (peers, opts = {}) {
    if (!peers) {
      throw new Error('Must provide "peers" argument')
    }
    super()
    var ttl = opts.ttl != null ? opts.ttl : 2 * 60 * 1000
    this.peers = peers
    this.data = new MapDeque()
    this.requesting = {}

    this.peers.on('inv', this._onInv.bind(this))
    this.peers.on('tx', this._onTx.bind(this))
    this.peers.on('getdata', this._onGetdata.bind(this))

    this.lastCount = 0
    this.interval = setInterval(this._removeOld.bind(this), ttl)
    if (this.interval.unref) this.interval.unref()
  }

  _onInv (items, peer = this.peers) {
    var getData = []
    for (let item of items) {
      if (item.type !== INV.MSG_TX) continue
      let hash = getHash(item.hash)
      if (this.requesting[hash] || this.data.has(hash)) continue
      getData.push(item)
      this.requesting[hash] = true
    }
    if (getData.length > 0) {
      peer.send('getdata', getData)
    }
  }

  _onTx (tx, peer = this.peers) {
    var hash = getHash(tx.getHash())
    delete this.requesting[hash]
    if (this.data.has(hash)) return
    this._add(tx, false)
    this.emit('tx', tx, peer)
    this.emit(`tx:${hash}`, tx, peer)
  }

  _onGetdata (items, peer = this.peers) {
    for (let item of items) {
      if (item.type !== INV.MSG_TX) continue
      let hash = getHash(item.hash)
      if (!this.data.has(hash)) continue
      let entry = this.data.get(hash)
      if (!entry.broadcast) continue
      peer.send('tx', this.data.get(hash).tx)
    }
  }

  _removeOld () {
    for (let i = 0; i < this.lastCount; i++) {
      this.data.shift()
    }
    this.lastCount = this.data.length
  }

  _add (tx, broadcast) {
    var hashBuf = tx.getHash()
    var hash = getHash(hashBuf)
    if (!this.data.has(hash)) {
      this.data.push(hash, { tx, broadcast })
    } else {
      this.data.get(hash).broadcast = true
    }
  }

  broadcast (tx) {
    this._add(tx, true)
    this._sendInv(tx, this.peers)
  }

  _sendInv (tx, peer) {
    peer.send('inv', [
      { hash: tx.getHash(), type: INV.MSG_TX }
    ])
  }

  get (hash) {
    var entry = this.data.get(getHash(hash))
    if (entry) return entry.tx
  }

  close () {
    clearInterval(this.interval)
    // TODO: stop listening to peers
  }
}

function getHash (hash) {
  return reverse(hash).toString('hex')
}

module.exports = old(Inventory)
