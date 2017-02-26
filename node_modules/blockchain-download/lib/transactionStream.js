'use strict';

var through = require('through2').ctor;

module.exports = through({ objectMode: true }, function (block, enc, cb) {
  if (block.height == null || !block.transactions) {
    return cb(new Error('Input to TransactionStream must be a stream of blocks'));
  }
  this.last = block;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = block.transactions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var transaction = _step.value;

      this.push({ transaction: transaction, block: block });
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

  cb(null);
});