var test = require('tape')
var randomBytes = require('crypto').pseudoRandomBytes
var INV = require('bitcoin-protocol').constants.inventory
var HeaderStream = require('..').HeaderStream
var createBlock = require('./common.js').createBlock
var MockPeer = require('./common.js').MockPeer
var wrapEvents = require('event-cleanup')

test('create HeaderStream', function (t) {
  t.test('normal constructor', function (t) {
    var hs = new HeaderStream(new MockPeer())
    t.ok(hs instanceof HeaderStream, 'got HeaderStream')
    t.end()
  })
  t.test('constructor without "new"', function (t) {
    var hs = HeaderStream(new MockPeer())
    t.ok(hs instanceof HeaderStream, 'got HeaderStream')
    t.end()
  })
  t.test('constructor without peers', function (t) {
    try {
      var hs = new HeaderStream()
      t.notOk(hs, 'should have thrown')
    } catch (err) {
      t.ok(err, 'error thrown')
      t.equal(err.message, '"peers" argument is required for HeaderStream', 'correct error message')
      t.end()
    }
  })
  t.end()
})

test('download from genesis', function (t) {
  var blocks = []
  var block
  var genesis = createBlock()
  for (var i = 0; i < 5000; i++) {
    block = createBlock(block || genesis)
    blocks.push(block)
  }

  var peer = new MockPeer()
  var hs = new HeaderStream(peer)

  t.test('genesis locator', function (t) {
    peer.once('getHeaders', function (locator, opts, cb) {
      setImmediate(function () {
        t.deepEqual(locator, [ genesis.header.getHash() ], 'correct locator')
        t.notOk(opts.stop, 'should not have stop option')
        var output = blocks.slice(0, 2000).map(function (block) {
          return block.header
        })
        cb(null, output, peer)
      })
    })
    hs.once('data', function (data) {
      t.ok(Array.isArray(data), 'got data array')
      t.equal(data.length, 2000, 'data has correct length')
      for (var i = 0; i < data.length; i++) {
        t.equal(data[i], blocks[i].header, 'data has correct headers')
      }
      t.notOk(hs.reachedTip, 'reachedTip = false')
      t.end()
    })
    hs.write([ genesis.header.getHash() ])
  })

  t.test('second locator', function (t) {
    peer.once('getHeaders', function (locator, opts, cb) {
      setImmediate(function () {
        t.deepEqual(locator, [ blocks[1999].header.getHash() ], 'correct locator')
        t.notOk(opts.stop, 'should not have stop option')
        var output = blocks.slice(2000, 4000).map(function (block) {
          return block.header
        })
        cb(null, output, peer)
      })
    })
    hs.once('data', function (data) {
      t.ok(Array.isArray(data), 'got data array')
      t.equal(data.length, 2000, 'data has correct length')
      for (var i = 0; i < data.length; i++) {
        t.equal(data[i], blocks[i + 2000].header, 'data has correct headers')
      }
      t.notOk(hs.reachedTip, 'reachedTip = false')
      t.end()
    })
    hs.write([ blocks[1999].header.getHash() ])
  })

  t.test('incomplete response', function (t) {
    t.plan(106)
    peer.once('getHeaders', function (locator, opts, cb) {
      setImmediate(function () {
        t.deepEqual(locator, [ blocks[3999].header.getHash() ], 'correct locator')
        t.notOk(opts.stop, 'should not have stop option')
        var output = blocks.slice(4000, 4100).map(function (block) {
          return block.header
        })
        cb(null, output, peer)
      })
    })
    hs.once('tip', function () {
      t.pass('emitted "tip" event')
      t.ok(hs.reachedTip, 'reachedTip = true')
    })
    hs.once('data', function (data) {
      t.ok(Array.isArray(data), 'got data array')
      t.equal(data.length, 100, 'data has correct length')
      for (var i = 0; i < data.length; i++) {
        t.equal(data[i], blocks[i + 4000].header, 'data has correct headers')
      }
    })
    hs.write([ blocks[3999].header.getHash() ])
  })

  var peerEvents = wrapEvents(peer)
  var hsEvents = wrapEvents(hs)
  t.test('locator after tip', function (t) {
    peerEvents.once('getHeaders', function (locator, opts, cb) {
      t.fail('"peer.getHeaders" should not have been called')
    })
    hsEvents.once('tip', function () {
      t.fail('"tip" event should not have been emitted')
    })
    hsEvents.once('data', function (data) {
      t.fail('"data" event should not have been emitted')
    })
    hs.write([ blocks[4099].header.getHash() ])
    t.end()
  })
  t.test('cleanup events', function (t) {
    peerEvents.removeAll()
    hsEvents.removeAll()
    t.end()
  })

  t.test('handling inv messages', function (t) {
    var block = blocks[4100]
    peer.once('getHeaders', function (locator, opts, cb) {
      setImmediate(function () {
        t.deepEqual(locator, [ blocks[4099].header.getHash() ], 'correct locator')
        t.notOk(opts.stop, 'should not have stop option')
        var output = [ blocks[4100].header ]
        cb(null, output, peer)
      })
    })
    hs.once('data', function (data) {
      t.ok(Array.isArray(data), 'got data array')
      t.equal(data.length, 1, 'data has correct length')
      t.equal(data[0], blocks[4100].header, 'data has correct header')
      t.end()
    })
    peer.emit('inv', [
      { type: INV.MSG_TX, hash: randomBytes(32) },
      { type: INV.MSG_BLOCK, hash: block.header.getHash() }
    ])
  })

  t.test('duplicate inv message', function (t) {
    var block = blocks[4100]
    peer.once('getHeaders', function (locator, opts, cb) {
      t.fail('"peer.getHeaders" should not have been called')
    })
    hsEvents.once('data', function (data) {
      t.fail('"data" event should not have been emitted')
    })
    peer.emit('inv', [
      { type: INV.MSG_BLOCK, hash: block.header.getHash() }
    ])
    t.end()
  })
  t.test('cleanup events', function (t) {
    peerEvents.removeAll()
    hsEvents.removeAll()
    t.end()
  })

  t.test('end', function (t) {
    hs.once('finish', function () {
      t.pass('"finish" event emitted')
      t.equal(hs.done, true, 'hs.done is true')
      t.end()
    })
    hs.end()
  })
})

test('stream options', function (t) {
  t.test('normal options', function (t) {
    var blocks = []
    var block
    var genesis = createBlock()
    for (var i = 0; i < 2000; i++) {
      block = createBlock(block || genesis)
      blocks.push(block)
    }

    var peer = new MockPeer()
    var hs = new HeaderStream(peer, {
      timeout: 1234,
      stop: blocks[1999].header.getHash()
    })

    t.test('genesis locator', function (t) {
      peer.once('getHeaders', function (locator, opts, cb) {
        setImmediate(function () {
          t.deepEqual(locator, [ genesis.header.getHash() ], 'correct locator')
          t.deepEqual(opts.stop, blocks[1999].header.getHash(), 'correct stop option')
          t.deepEqual(opts.timeout, 1234, 'correct timeout option')
          var output = blocks.slice(0, 2000).map(function (block) {
            return block.header
          })
          cb(null, output, peer)
        })
      })
      hs.once('finish', function () {
        t.pass('"finish" event emitted')
        t.equal(hs.done, true, 'hs.done is true')
        t.end()
      })
      hs.once('data', function (data) {
        t.ok(Array.isArray(data), 'got data array')
        t.equal(data.length, 2000, 'data has correct length')
        for (var i = 0; i < data.length; i++) {
          t.equal(data[i], blocks[i].header, 'data has correct headers')
        }
        t.notOk(hs.reachedTip, 'reachedTip = false')
      })
      hs.write([ genesis.header.getHash() ])
    })
  })

  t.test('endOnTip', function (t) {
    var peer = new MockPeer()
    var hs = new HeaderStream(peer, { endOnTip: true })
    var genesis = createBlock()

    t.test('genesis locator', function (t) {
      peer.once('getHeaders', function (locator, opts, cb) {
        setImmediate(function () {
          cb(null, [])
        })
      })
      hs.once('tip', function () {
        t.pass('"tip" event emitted')
      })
      hs.once('finish', function () {
        t.pass('"finish" event emitted')
        t.equal(hs.done, true, 'hs.done is true')
        t.end()
      })
      hs.write([ genesis.header.getHash() ])
    })
  })
})

test('getHeaders error', function (t) {
  var genesis = createBlock()
  var peer = new MockPeer()
  var hs = new HeaderStream(peer)

  t.test('genesis locator', function (t) {
    peer.once('getHeaders', function (locator, opts, cb) {
      setImmediate(function () {
        t.deepEqual(locator, [ genesis.header.getHash() ], 'correct locator')
        cb(new Error('error'))
      })
    })
    hs.once('error', function (err) {
      t.ok(err, '"error" event emitted')
      t.equal(err.message, 'error', 'correct error message')
      t.end()
    })
    hs.write([ genesis.header.getHash() ])
  })
})

test('lookahead', function (t) {
  t.test('finish lookahead request before validating blocks', function (t) {
    var peer = new MockPeer()
    var hs = new HeaderStream(peer)
    var blocks = []
    var block
    var genesis = createBlock()
    for (var i = 0; i < 4000; i++) {
      block = createBlock(block || genesis)
      blocks.push(block)
    }

    peer.once('getHeaders', function (locator, opts, cb) {
      t.pass('initial getHeaders request')
      t.deepEqual(locator, [ genesis.header.getHash() ],
        'locator is correct')

      peer.once('getHeaders', function (locator, opts, cb) {
        t.pass('lookahead locator was requested')
        t.deepEqual(locator, [ blocks[1999].header.getHash() ],
          'locator is correct')
        hs.once('data', function (data) {
          t.pass('second batch of headers emitted')
          t.end()
        })
        cb(null, blocks.slice(2000, 4000).map(function (block) {
          return block.header
        }), peer)
        setTimeout(function () {
          hs.write([ blocks[1999].header.getHash() ])
        }, 1000)
      })

      hs.once('data', function (data) {
        t.pass('first batch of headers emitted')
      })
      cb(null, blocks.slice(0, 2000).map(function (block) {
        return block.header
      }), peer)
    })

    hs.write([ genesis.header.getHash() ])
  })

  t.test('lookahead with invalid first response', function (t) {
    var peer = new MockPeer()
    var hs = new HeaderStream(peer)
    var blocks = []
    var block
    var genesis = createBlock()
    for (var i = 0; i < 4000; i++) {
      block = createBlock(block || genesis)
      blocks.push(block)
    }

    peer.once('getHeaders', function (locator, opts, cb) {
      t.pass('initial getHeaders request')
      t.deepEqual(locator, [ genesis.header.getHash() ],
        'locator is correct')

      peer.once('getHeaders', function (locator, opts, cb) {
        t.pass('lookahead locator was requested')
        t.deepEqual(locator, [ blocks[1999].header.getHash() ],
          'locator is correct')
        hs.once('data', function (data) {
          t.fail('lookahead headers emitted')
        })
        peer.once('getHeaders', function (locator, opts, cb) {
          t.pass('retry getHeaders request')
          t.deepEqual(locator, [ genesis.header.getHash() ],
            'locator is correct')
          t.end()
        })
        cb(null, blocks.slice(2000, 4000).map(function (block) {
          return block.header
        }), peer)
        setTimeout(function () {
          hs.write([ genesis.header.getHash() ])
        }, 1000)
      })

      hs.once('data', function (data) {
        t.pass('first batch of headers emitted')
      })
      cb(null, blocks.slice(0, 2000).map(function (block) {
        return block.header
      }), peer)
    })

    hs.write([ genesis.header.getHash() ])
  })

  t.test('lookahead response after validation', function (t) {
    var peer = new MockPeer()
    var hs = new HeaderStream(peer)
    var blocks = []
    var block
    var genesis = createBlock()
    for (var i = 0; i < 4000; i++) {
      block = createBlock(block || genesis)
      blocks.push(block)
    }

    peer.once('getHeaders', function (locator, opts, cb) {
      t.pass('initial getHeaders request')
      t.deepEqual(locator, [ genesis.header.getHash() ],
        'locator is correct')

      peer.once('getHeaders', function (locator, opts, cb) {
        t.pass('lookahead locator was requested')
        t.deepEqual(locator, [ blocks[1999].header.getHash() ],
          'locator is correct')
        hs.once('data', function (data) {
          t.pass('second batch of headers emitted')
          t.end()
        })
        hs.write([ blocks[1999].header.getHash() ])
        setImmediate(function () {
          cb(null, blocks.slice(2000, 4000).map(function (block) {
            return block.header
          }), peer)
        }, 1000)
      })

      hs.once('data', function (data) {
        t.pass('first batch of headers emitted')
      })
      cb(null, blocks.slice(0, 2000).map(function (block) {
        return block.header
      }), peer)
    })

    hs.write([ genesis.header.getHash() ])
  })

  t.test('lookahead response after invalid validation', function (t) {
    var peer = new MockPeer()
    var hs = new HeaderStream(peer)
    var blocks = []
    var block
    var genesis = createBlock()
    for (var i = 0; i < 4000; i++) {
      block = createBlock(block || genesis)
      blocks.push(block)
    }

    peer.once('getHeaders', function (locator, opts, cb) {
      t.pass('initial getHeaders request')
      t.deepEqual(locator, [ genesis.header.getHash() ],
        'locator is correct')

      peer.once('getHeaders', function (locator, opts, cb) {
        t.pass('lookahead locator was requested')
        t.deepEqual(locator, [ blocks[1999].header.getHash() ],
          'locator is correct')
        hs.once('data', function (data) {
          t.fail('lookahead headers emitted')
        })
        peer.once('getHeaders', function (locator, opts, cb) {
          t.pass('retry getHeaders request')
          t.deepEqual(locator, [ genesis.header.getHash() ],
            'locator is correct')
          t.end()
        })
        hs.write([ genesis.header.getHash() ])
        setImmediate(function () {
          cb(null, blocks.slice(2000, 4000).map(function (block) {
            return block.header
          }), peer)
        }, 1000)
      })

      hs.once('data', function (data) {
        t.pass('first batch of headers emitted')
      })
      cb(null, blocks.slice(0, 2000).map(function (block) {
        return block.header
      }), peer)
    })

    hs.write([ genesis.header.getHash() ])
  })
})
