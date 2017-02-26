var Transform = require('stream').Transform
var util = require('util')
var Inventory = require('bitcoin-inventory')
var merkleProof = require('bitcoin-merkle-proof')
var debug = require('debug')('blockchain-download:blockstream')
var wrapEvents = require('event-cleanup')
var assign = require('object-assign')

var BlockStream = module.exports = function (peers, opts) {
  if (!(this instanceof BlockStream)) return new BlockStream(peers, opts)
  if (!peers) throw new Error('"peers" argument is required for BlockStream')
  Transform.call(this, { objectMode: true })

  debug(`created BlockStream: ${JSON.stringify(opts, null, '  ')}`)

  opts = opts || {}
  this.peers = peers
  this.batchSize = opts.batchSize || 64
  this.filtered = opts.filtered
  this.batchTimeout = opts.batchTimeout || 2 * 1000
  this.inventory = opts.inventory
  if (!this.inventory) {
    this.inventory = Inventory(peers, { ttl: 10 * 1000 })
    this.createdInventory = true
  }

  this.batch = []
  this._batchTimeout = null
  this.fetching = 0
}
util.inherits(BlockStream, Transform)

BlockStream.prototype._error = function (err) {
  if (err) this.emit('error', err)
}

BlockStream.prototype._transform = function (block, enc, cb) {
  // buffer block hashes until we have `batchSize`, then make a `getdata`
  // request with all of them once the batch fills up, or if we don't receive
  // any headers for a certain amount of time (`batchTimeout` option)
  this.batch.push(block)
  this.fetching++
  if (this._batchTimeout) clearTimeout(this._batchTimeout)
  if (this.batch.length >= this.batchSize) {
    this._sendBatch(cb)
  } else {
    this._batchTimeout = setTimeout(() => {
      this._sendBatch(this._error.bind(this))
    }, this.batchTimeout)
    cb(null)
  }
}

BlockStream.prototype._flush = function (cb) {
  if (this.fetching === 0 && !this._batchTimeout) return cb(null)
  if (this._batchTimeout) {
    clearTimeout(this._batchTimeout)
    this._batchTimeout = null
    this._sendBatch(this._error.bind(this))
  }
  this.on('data', () => {
    if (this.fetching === 0) cb(null)
  })
}

BlockStream.prototype._sendBatch = function (cb) {
  var batch = this.batch
  this.batch = []
  var hashes = batch.map((block) => block.header.getHash())
  this.peers.getBlocks(hashes, {
    filtered: this.filtered,
    timeout: this.timeout
  }, (err, blocks, peer) => {
    if (err) return cb(err)
    var onBlock = this.filtered ? this._onMerkleBlock : this._onBlock
    blocks.forEach((block, i) => {
      block = assign({}, batch[i], block)
      onBlock.call(this, block, peer)
    })
    cb(null)
  })
}

BlockStream.prototype._onBlock = function (block) {
  this._push(block)
}

BlockStream.prototype._onMerkleBlock = function (block, peer) {
  var self = this

  var txids = merkleProof.verify({
    flags: block.flags,
    hashes: block.hashes,
    numTransactions: block.numTransactions,
    merkleRoot: block.header.merkleRoot
  })
  if (txids.length === 0) return done([])

  var transactions = []
  var remaining = txids.length

  var timeout = peer.latency * 6 + 2000
  var txTimeout = setTimeout(() => {
    this.peers.getTransactions(txids, (err, transactions) => {
      if (err) return this._error(err)
      done(transactions)
    })
  }, timeout)

  var events = wrapEvents(this.inventory)
  txids.forEach((txid, i) => {
    var tx = this.inventory.get(txid)
    if (tx) {
      maybeDone(tx, i)
      return
    }
    var hash = txid.toString('hex')
    events.once(`tx:${hash}`, (tx) => maybeDone(tx, i))
  })

  function maybeDone (tx, i) {
    transactions[i] = tx
    remaining--
    if (remaining === 0) done(transactions)
  }

  function done (transactions) {
    clearTimeout(txTimeout)
    if (events) events.removeAll()
    block.transactions = transactions
    self._push(block)
  }
}

BlockStream.prototype._push = function (block) {
  this.fetching--
  this.push(block)
}

BlockStream.prototype.end = function () {
  Transform.prototype.end.call(this)
  if (this.createdInventory) {
    this.once('finish', () => this.inventory.close())
  }
}
