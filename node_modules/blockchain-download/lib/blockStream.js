'use strict';

var Transform = require('stream').Transform;
var util = require('util');
var Inventory = require('bitcoin-inventory');
var merkleProof = require('bitcoin-merkle-proof');
var debug = require('debug')('blockchain-download:blockstream');
var wrapEvents = require('event-cleanup');
var assign = require('object-assign');

var BlockStream = module.exports = function (peers, opts) {
  if (!(this instanceof BlockStream)) return new BlockStream(peers, opts);
  if (!peers) throw new Error('"peers" argument is required for BlockStream');
  Transform.call(this, { objectMode: true });

  debug('created BlockStream: ' + JSON.stringify(opts, null, '  '));

  opts = opts || {};
  this.peers = peers;
  this.batchSize = opts.batchSize || 64;
  this.filtered = opts.filtered;
  this.batchTimeout = opts.batchTimeout || 2 * 1000;
  this.inventory = opts.inventory;
  if (!this.inventory) {
    this.inventory = Inventory(peers, { ttl: 10 * 1000 });
    this.createdInventory = true;
  }

  this.batch = [];
  this._batchTimeout = null;
  this.fetching = 0;
};
util.inherits(BlockStream, Transform);

BlockStream.prototype._error = function (err) {
  if (err) this.emit('error', err);
};

BlockStream.prototype._transform = function (block, enc, cb) {
  var _this = this;

  // buffer block hashes until we have `batchSize`, then make a `getdata`
  // request with all of them once the batch fills up, or if we don't receive
  // any headers for a certain amount of time (`batchTimeout` option)
  this.batch.push(block);
  this.fetching++;
  if (this._batchTimeout) clearTimeout(this._batchTimeout);
  if (this.batch.length >= this.batchSize) {
    this._sendBatch(cb);
  } else {
    this._batchTimeout = setTimeout(function () {
      _this._sendBatch(_this._error.bind(_this));
    }, this.batchTimeout);
    cb(null);
  }
};

BlockStream.prototype._flush = function (cb) {
  var _this2 = this;

  if (this.fetching === 0 && !this._batchTimeout) return cb(null);
  if (this._batchTimeout) {
    clearTimeout(this._batchTimeout);
    this._batchTimeout = null;
    this._sendBatch(this._error.bind(this));
  }
  this.on('data', function () {
    if (_this2.fetching === 0) cb(null);
  });
};

BlockStream.prototype._sendBatch = function (cb) {
  var _this3 = this;

  var batch = this.batch;
  this.batch = [];
  var hashes = batch.map(function (block) {
    return block.header.getHash();
  });
  this.peers.getBlocks(hashes, {
    filtered: this.filtered,
    timeout: this.timeout
  }, function (err, blocks, peer) {
    if (err) return cb(err);
    var onBlock = _this3.filtered ? _this3._onMerkleBlock : _this3._onBlock;
    blocks.forEach(function (block, i) {
      block = assign({}, batch[i], block);
      onBlock.call(_this3, block, peer);
    });
    cb(null);
  });
};

BlockStream.prototype._onBlock = function (block) {
  this._push(block);
};

BlockStream.prototype._onMerkleBlock = function (block, peer) {
  var _this4 = this;

  var self = this;

  var txids = merkleProof.verify({
    flags: block.flags,
    hashes: block.hashes,
    numTransactions: block.numTransactions,
    merkleRoot: block.header.merkleRoot
  });
  if (txids.length === 0) return done([]);

  var transactions = [];
  var remaining = txids.length;

  var timeout = peer.latency * 6 + 2000;
  var txTimeout = setTimeout(function () {
    _this4.peers.getTransactions(txids, function (err, transactions) {
      if (err) return _this4._error(err);
      done(transactions);
    });
  }, timeout);

  var events = wrapEvents(this.inventory);
  txids.forEach(function (txid, i) {
    var tx = _this4.inventory.get(txid);
    if (tx) {
      maybeDone(tx, i);
      return;
    }
    var hash = txid.toString('hex');
    events.once('tx:' + hash, function (tx) {
      return maybeDone(tx, i);
    });
  });

  function maybeDone(tx, i) {
    transactions[i] = tx;
    remaining--;
    if (remaining === 0) done(transactions);
  }

  function done(transactions) {
    clearTimeout(txTimeout);
    if (events) events.removeAll();
    block.transactions = transactions;
    self._push(block);
  }
};

BlockStream.prototype._push = function (block) {
  this.fetching--;
  this.push(block);
};

BlockStream.prototype.end = function () {
  var _this5 = this;

  Transform.prototype.end.call(this);
  if (this.createdInventory) {
    this.once('finish', function () {
      return _this5.inventory.close();
    });
  }
};