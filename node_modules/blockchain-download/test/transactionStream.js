var test = require('tape')
var TransactionStream = require('..').TransactionStream

test('create TransactionStream', function (t) {
  t.test('normal constructor', function (t) {
    var ts = new TransactionStream()
    t.ok(ts instanceof TransactionStream, 'got TransactionStream')
    t.end()
  })
  t.test('constructor without "new"', function (t) {
    var ts = TransactionStream()
    t.ok(ts instanceof TransactionStream, 'got TransactionStream')
    t.end()
  })
})

test('transform', function (t) {
  t.test('simple transform', function (t) {
    var ts = new TransactionStream()
    var blocks = [
      { height: 0, transactions: [ 0, 1 ] },
      { height: 1, transactions: [ 2, 3 ] },
      { height: 2, transactions: [] },
      { height: 3, transactions: [ 4 ] }
    ]
    var expected = [
      { block: blocks[0], transaction: 0 },
      { block: blocks[0], transaction: 1 },
      { block: blocks[1], transaction: 2 },
      { block: blocks[1], transaction: 3 },
      { block: blocks[3], transaction: 4 }
    ]
    ts.on('data', function (data) {
      t.deepEqual(data, expected.shift(), 'correct data')
      if (expected.length === 0) t.end()
    })
    for (var i = 0; i < blocks.length; i++) {
      ts.write(blocks[i])
    }
  })
  t.test('transform with invalid input data', function (t) {
    var ts = new TransactionStream()
    ts.once('error', function (err) {
      t.ok(err, '"error" event emitted')
      t.equal(err.message, 'Input to TransactionStream must be a stream of blocks', 'correct error message')
      t.end()
    })
    ts.write({})
  })
})
