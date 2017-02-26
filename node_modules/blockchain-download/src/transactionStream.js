var through = require('through2').ctor

module.exports = through({ objectMode: true }, function (block, enc, cb) {
  if (block.height == null || !block.transactions) {
    return cb(new Error('Input to TransactionStream must be a stream of blocks'))
  }
  this.last = block
  for (var transaction of block.transactions) {
    this.push({ transaction, block })
  }
  cb(null)
})
