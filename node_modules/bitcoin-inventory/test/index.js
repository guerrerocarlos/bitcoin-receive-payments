var EventEmitter = require('events')
var inherits = require('util').inherits
var INV = require('bitcoin-protocol').constants.inventory
var wrapEvents = require('event-cleanup')
var test = require('tape')
var Inventory = require('..')

test('create Inventory', function (t) {
  t.test('no peers', function (t) {
    try {
      var inv = new Inventory()
      t.notOk(inv, 'should have thrown')
    } catch (err) {
      t.ok(err, 'threw error')
      t.equal(err.message, 'Must provide "peers" argument', 'correct error message')
      t.end()
    }
  })
  t.test('normal constructor', function (t) {
    var inv = new Inventory(new MockPeer())
    t.ok(inv instanceof Inventory, 'got Inventory')
    inv.close()
    t.end()
  })
  t.test('constructor without "new"', function (t) {
    var inv = Inventory(new MockPeer())
    t.ok(inv instanceof Inventory, 'got Inventory')
    inv.close()
    t.end()
  })
  t.end()
})

test('inv handling', function (t) {
  var peer = new MockPeer()
  var inv = new Inventory(peer)
  var hash = Buffer('0123456789abcdefghijklmnopqrstuv')
  t.test('single item inv', function (t) {
    peer.once('send', function (command, message) {
      t.equal(command, 'getdata', 'sent getdata')
      t.ok(Array.isArray(message), 'message is an array')
      t.equal(message.length, 1, 'message has length 1')
      t.equal(message[0].hash.toString('hex'), hash.toString('hex'), 'correct hash')
      t.equal(message[0].type, INV.MSG_TX, 'correct inv type')
      t.end()
    })
    peer.emit('inv', [{ hash: hash, type: INV.MSG_TX }], peer)
  })
  t.test('multiple item inv', function (t) {
    var hashes = [
      Buffer('01234567890123456789012345678901'),
      Buffer('abcdefghijklmnopqrstuv0123456789')
    ]
    peer.once('send', function (command, message) {
      t.equal(command, 'getdata', 'sent getdata')
      t.ok(Array.isArray(message), 'message is an array')
      t.equal(message.length, 2, 'message has length 2')
      t.equal(message[0].hash.toString('hex'), hashes[0].toString('hex'), 'correct hash')
      t.equal(message[1].hash.toString('hex'), hashes[1].toString('hex'), 'correct hash')
      t.equal(message[0].type, INV.MSG_TX, 'correct inv type')
      t.equal(message[1].type, INV.MSG_TX, 'correct inv type')
      t.end()
    })
    peer.emit('inv', hashes.map(function (hash) {
      return { hash: hash, type: INV.MSG_TX }
    }), peer)
  })
  t.test('inv that is being requested', function (t) {
    peer.once('send', function (command, message) {
      t.fail('should not have sent message')
    })
    peer.emit('inv', [{ hash: hash, type: INV.MSG_TX }], peer)
    t.end()
  })
  t.test('inv that is in the inventory', function (t) {
    inv.once('tx', function () {
      peer.once('send', function (command, message) {
        t.fail('should not have sent message')
      })
      peer.emit('inv', [{ hash: hash, type: INV.MSG_TX }], peer)
      t.end()
    })
    peer.emit('tx', { getHash: function () { return hash } })
  })
  t.test('non-tx inv', function (t) {
    peer.once('send', function (command, message) {
      t.fail('should not have sent message')
    })
    peer.emit('inv', [{ hash: Buffer(32), type: INV.MSG_BLOCK }], peer)
    t.end()
  })
  t.test('close', function (t) {
    inv.close()
    t.end()
  })
})

test('tx handling', function (t) {
  var peer = new MockPeer()
  var inv = new Inventory(peer)
  var peerEvents = wrapEvents(peer)
  var invEvents = wrapEvents(inv)

  function eventCleanup (t) {
    t.test('event cleanup', function (t) {
      peerEvents.removeAll()
      invEvents.removeAll()
      t.end()
    })
  }

  t.test('unrequested tx', function (t) {
    t.plan(7)
    var hash = Buffer(32).fill('a')
    var tx = { getHash: function () { return hash } }
    peerEvents.once('send', function (command, message) {
      t.fail('should not have sent message')
    })
    invEvents.once('tx', function (tx2, peer2) {
      t.pass('emitted "tx" event')
      t.equal(tx2, tx, 'got tx')
      t.equal(peer2, peer, 'got peer')
      peerEvents.removeAll()
      peerEvents.once('send', function (command, message) {
        t.fail('should not have sent message')
      })
      peer.emit('getdata', [{ hash: hash, type: INV.MSG_TX }])
    })
    invEvents.once('tx:' + hash.toString('hex'), function (tx2, peer2) {
      t.pass('emitted "tx:<hash>" event')
      t.equal(tx2, tx, 'got tx')
      t.equal(peer2, peer, 'got peer')
    })
    peer.emit('tx', tx)
    t.equal(inv.get(hash), tx, 'tx is in inventory')
  })
  eventCleanup(t)

  t.test('duplicate tx', function (t) {
    var hash = Buffer(32).fill('a')
    var tx = { getHash: function () { return hash } }
    peerEvents.once('send', function (command, message) {
      t.fail('should not have sent message')
    })
    invEvents.once('tx', function (tx2, peer2) {
      t.fail('should not have emitted "tx"')
    })
    invEvents.once('tx:' + hash.toString('hex'), function (tx2, peer2) {
      t.fail('should not have emitted "tx:<hash>"')
    })
    peer.emit('tx', tx)
    t.equal(inv.get(hash).getHash().toString('hex'), hash.toString('hex'),
      'tx is still in inventory')
    t.end()
  })
  eventCleanup(t)

  t.test('requested tx', function (t) {
    var hash = Buffer(32).fill('b')
    var tx = { getHash: function () { return hash } }
    peerEvents.once('send', function (command, message) {
      t.equal(command, 'getdata', 'sent getdata')
      t.equal(message.length, 1, 'getdata has length 1')
      t.equal(message[0].hash.toString('hex'), hash.toString('hex'), 'getdata has correct hash')
      peerEvents.once('send', function (command, message) {
        t.fail('should not have sent message')
      })
      peer.emit('tx', tx)
    })
    invEvents.once('tx', function (tx2, peer2) {
      t.pass('emitted "tx" event')
      t.equal(tx2, tx, 'got tx')
      t.equal(peer2, peer, 'got peer')

      peerEvents.once('send', function (command, message) {
        t.fail('should not have sent message')
      })
      peer.emit('getdata', [{ hash: hash, type: INV.MSG_TX }])
      t.end()
    })
    peer.emit('inv', [{ hash: hash, type: INV.MSG_TX }])
  })
  eventCleanup(t)

  t.test('close', function (t) {
    inv.close()
    t.end()
  })
})

test('broadcast', function (t) {
  var peer = new MockPeer()
  var inv = new Inventory(peer)

  var hash = Buffer(32).fill('a')
  var tx = { getHash: function () { return hash } }

  t.test('broadcast', function (t) {
    peer.once('send', function (command, message) {
      t.equal(command, 'inv', 'sent inv')
      t.equal(message.length, 1, 'message has length 1')
      t.equal(message[0].hash.toString('hex'), hash.toString('hex'), 'correct hash')
      t.end()
    })
    inv.broadcast(tx)
  })

  t.test('respond to getdata', function (t) {
    peer.once('send', function (command, message) {
      t.equal(command, 'tx', 'sent tx message')
      t.equal(message, tx, 'correct tx')
      t.end()
    })
    peer.emit('getdata', [{ hash: hash, type: INV.MSG_TX }])
  })

  t.test('broadcast existing tx', function (t) {
    peer.once('send', function (command, message) {
      t.equal(command, 'inv', 'sent inv')
      t.equal(message.length, 1, 'message has length 1')
      t.equal(message[0].hash.toString('hex'), hash.toString('hex'), 'correct hash')
      t.end()
    })
    inv.broadcast(tx)
  })

  t.test('getdata with wrong type', function (t) {
    peer.once('send', function (command, message) {
      t.fail('should not have sent message')
    })
    peer.emit('getdata', [{ hash: hash, type: INV.MSG_BLOCK }])
    t.end()
  })

  t.test('getdata with wrong hash', function (t) {
    peer.once('send', function (command, message) {
      t.fail('should not have sent message')
    })
    peer.emit('getdata', [{ hash: Buffer(32).fill('b'), type: INV.MSG_TX }])
    t.end()
  })

  t.test('close', function (t) {
    inv.close()
    t.end()
  })
})

test('expiration', function (t) {
  var peer = new MockPeer()
  var ttl = 500
  var inv = new Inventory(peer, { ttl: ttl })

  var hash = Buffer(32).fill('a')
  var tx = { getHash: function () { return hash } }
  var hash2 = Buffer(32).fill('b')
  var tx2 = { getHash: function () { return hash2 } }
  var hash3 = Buffer(32).fill('c')
  var tx3 = { getHash: function () { return hash3 } }

  peer.emit('tx', tx)
  peer.emit('tx', tx2)
  t.equals(inv.get(hash), tx, 'inv has tx')
  t.equals(inv.get(hash2), tx2, 'inv has tx2')
  setTimeout(function () {
    t.equals(inv.get(hash), tx, 'inv still has tx')
    t.equals(inv.get(hash2), tx2, 'inv still has tx2')
    peer.emit('tx', tx3)
    t.equals(inv.get(hash3), tx3, 'inv has tx3')
    setTimeout(function () {
      t.notOk(inv.get(hash), 'tx removed')
      t.notOk(inv.get(hash2), 'tx2 removed')
      t.equals(inv.get(hash3), tx3, 'inv still has tx3')
      setTimeout(function () {
        t.notOk(inv.get(hash3), 'tx3 removed')
        inv.close()
        t.end()
      }, ttl + 10)
    }, ttl + 10)
  }, ttl + 10)
})

test('get', function (t) {
  var peer = new MockPeer()
  var inv = new Inventory(peer)
  t.test('get nonexistent tx', function (t) {
    t.notOk(inv.get(Buffer(32).fill('a')), 'no tx returned')
    t.end()
  })
  t.test('close', function (t) {
    inv.close()
    t.end()
  })
  t.end()
})

function MockPeer () {
  EventEmitter.call(this)
}
inherits(MockPeer, EventEmitter)
MockPeer.prototype.send = function (command, message) {
  this.emit('send', command, message)
}
