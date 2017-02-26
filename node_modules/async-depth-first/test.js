var test = require('tape')
var async = require('./')

function timeout (fn) {
  setTimeout(fn, Math.random() * 50)
}

test('depth first sequence', function (t) {
  var q = async()
  var seq = []
  q.defer(function (cb) {
    seq.push('1')
    q.defer(function (cb) {
      timeout(function () {
        seq.push('1.1')
        q.defer(function (cb) {
          timeout(function () {
            seq.push('1.1.1')
            cb()
          })
        })
        cb()
      })
    })
    q.defer(function (cb) {
      timeout(function () {
        seq.push('1.2')
        cb()
      })
    })
    timeout(cb)
  })
  q.defer(function (cb) {
    seq.push('2')
    q.defer(function (cb) {
      seq.push('2.1')
      timeout(cb)
    })
    q.defer(function (cb) {
      seq.push('2.2')
      timeout(cb)
    })
    timeout(cb)
  })
  q.defer(function (cb) {
    seq.push('3')
    timeout(cb)
  })
  setTimeout(function () {
    q.done(function (err) {
      t.notOk(err)
      t.deepEqual(seq, [
        '1', '1.1', '1.1.1', '1.2', '2', '2.1', '2.2', '3'
      ], 'depth first traversal')
      t.end()
    })
  }, 1000)
})

test('error', function (t) {
  var q = async()
  var seq = []
  q.defer(function (cb) {
    seq.push('1')
    q.defer(function (cb) {
      timeout(function () {
        seq.push('1.1')
        q.defer(function (cb) {
          timeout(function () {
            seq.push('1.1.1')
            cb()
          })
        })
        cb()
      })
    })
    q.defer(function (cb) {
      seq.push('1.2')
      timeout(cb)
    })
    timeout(cb)
  })
  q.defer(function (cb) {
    seq.push('2')
    q.defer(function (cb) {
      seq.push('2.1')
      cb('boooom')
    })
    q.defer(function (cb) {
      seq.push('2.2')
      timeout(cb)
    })
    timeout(cb)
  })
  q.defer(function (cb) {
    seq.push('3')
    timeout(cb)
  })
  q.done(function (err) {
    t.equal(err, 'boooom', 'error return')
    t.deepEqual(seq, [
      '1', '1.1', '1.1.1', '1.2', '2', '2.1'
    ], 'partial traversal')
    t.end()
  })
})
