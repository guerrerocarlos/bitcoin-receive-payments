'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var Readable = require('stream').Readable;
var inherits = require('inherits');
var u = require('bitcoin-util');
require('setimmediate');

function HeaderStream(chain, opts) {
  if (!chain) throw new Error('"chain" argument is required');
  if (!(this instanceof HeaderStream)) return new HeaderStream(chain, opts);
  Readable.call(this, { objectMode: true });

  opts = opts || {};
  this.chain = chain;
  this.start = this.cursor = opts.from || chain.genesis.hash;
  this.sync = opts.sync != null ? opts.sync : true;

  this.paused = false;
  this.ended = false;
  this.first = true;
  if (!opts.from || opts.from.equals(u.nullHash)) {
    this.first = false;
  }
  this.lastHash = u.nullHash;
  this.lastBlock = null;
}
inherits(HeaderStream, Readable);

HeaderStream.prototype._read = function () {
  this._next();
};

HeaderStream.prototype._next = function () {
  var _this = this;

  if (this.paused || this.ended) return;
  this.paused = true;

  // we reached end of chain, wait for new tip
  if (!this.cursor) {
    var getPath = function getPath(block) {
      _this.chain.getPath(_this.lastBlock, block, function (err, path) {
        if (err) return _this.emit('error', err);
        // reorg handling (remove blocks to get to new fork)
        _this._pushPath(path);
        _this.paused = false;
        setImmediate(_this._next.bind(_this));
      });
    };
    this.chain.once('tip', function (block) {
      if (!_this.sync) return getPath(block);
      _this.chain.once('commit', function () {
        return getPath(block);
      });
    });
    return;
  }

  // stream headers that are already stored
  this.chain.getBlock(this.cursor, function (err, block) {
    if (_this.ended) return;
    if (err) return _this.emit('error', err);

    if (!block) {
      // if current "next" block is not found
      if (_this.cursor.equals(_this.start)) {
        // if this is the `from` block, wait until we see the block
        _this.chain.once('header:' + _this.cursor.toString('base64'), _this._next.bind(_this));
      } else {
        _this.emit('error', new Error('HeaderStream error: chain should ' + ('continue to block "' + _this.cursor.toString('hex') + '", but it was ') + 'not found in the BlockStore'));
      }
      return;
    }

    // when starting, ensure we are on the best chain
    if (_this.first) {
      var _ret = function () {
        var done = function done() {
          _this.paused = false;
          _this.first = false;
          _this.emit('init');
          setImmediate(_this._next.bind(_this));
        };
        _this.chain.getBlockAtHeight(block.height, function (err, bestChainBlock) {
          if (err) return _this.emit('error', err);
          if (block.header.getHash().equals(bestChainBlock.header.getHash())) {
            // we are already on the best chain, continue like normal
            _this.cursor = block.next;
            _this.lastHash = block.header.getHash();
            _this.lastBlock = block;
            return done();
          }
          // we need to add/remove some blocks to get to the best chain
          _this.chain.getPath(block, bestChainBlock, function (err, path) {
            if (err) return _this.emit('error', err);
            _this._pushPath(path);
            done();
          });
        });
        return {
          v: void 0
        };
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    }

    // we have the cursor block, so push it and continue
    _this.paused = false;
    block.add = true;
    var res = _this._push(block);
    if (res) _this._next();
  });
};

HeaderStream.prototype._push = function (block) {
  if (this.ended) return;
  this.cursor = block.next;
  this.lastHash = block.header.getHash();
  this.lastBlock = block;
  return this.push(block);
};

HeaderStream.prototype._pushPath = function (path) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = path.remove[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var block = _step.value;

      block.add = false;
      this._push(block);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = path.add[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _block = _step2.value;

      _block.add = true;
      this._push(_block);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }
};

HeaderStream.prototype.end = function () {
  this.ended = true;
  this.push(null);
};

module.exports = HeaderStream;