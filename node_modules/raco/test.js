var test = require('tape')
var raco = require('./')

test('arguments and callback return', function (t) {
  t.plan(10)

  var fn = raco.wrap(function * (num, str, next) {
    t.equal(num, 167, 'arguemnt')
    t.equal(str, '167', 'arguemnt')
    t.equal(yield next(null, 'foo'), 'foo', 'stepping function')
    next(null, 'foo', 'bar') // should return
    return 'boom' // should not return
  })

  // callback
  t.notOk(fn(167, '167', function (err, res) {
    t.notOk(err, 'no callback error')
    t.deepEqual(
      Array.prototype.slice.call(arguments),
      [null, 'foo', 'bar'],
      'return callback arguments'
    )
  }), 'passing callback returns undefined')

  // promise
  fn(167, '167').then(function () {
    t.deepEqual(
      Array.prototype.slice.call(arguments),
      ['foo'],
      'return callback value for promise'
    )
  }, t.error)
})

test('prepend next arg', function (t) {
  t.plan(10)
  var fn = raco.wrap(function * (next, num, str) {
    t.equal(num, 167, 'arguemnt')
    t.equal(str, '167', 'arguemnt')
    t.equal(yield next(null, 'foo'), 'foo', 'stepping function')
    next(null, 'foo', 'bar') // should return
    return 'boom' // should not return
  }, { prepend: true })

  // callback
  t.notOk(fn(167, '167', function (err, res) {
    t.notOk(err, 'no callback error')
    t.deepEqual(
      Array.prototype.slice.call(arguments),
      [null, 'foo', 'bar'],
      'return callback arguments'
    )
  }), 'passing callback returns undefined')

  // promise
  fn(167, '167').then(function () {
    t.deepEqual(
      Array.prototype.slice.call(arguments),
      ['foo'],
      'return callback value for promise'
    )
  }, t.error)
})

test('multiple callbacks handling', function (t) {
  t.plan(4)

  raco.wrap(function * (next) {
    next(null, 'foo')
    next(null, 'bar')
    return true
  })(function (err, val) {
    t.equal(
      err.message,
      'Multiple callbacks within one iteration',
      'next twice error'
    )
    t.error(val)
  })

  raco.wrap(function * (next) {
    next(null, 'foo')
    return 'bar'
  })(function (err, val) {
    t.error(err)
    t.equal(val, 'foo', 'return first callback on return')
  })
})

test('scope', function (t) {
  t.plan(1)

  var obj = {}

  raco.wrap(function * () {
    t.equal(this, obj, 'correct scope')
    t.end()
  }).call(obj)
})

test('explicit throws', function (t) {
  t.plan(2)
  var r = raco({ Promise: null })

  t.throws(r.wrap(function * () {
    throw new Error('boom')
  }), 'boom', 'no callback & promise throws')

  t.throws(function () {
    r(function * () {
      throw new Error('boom')
    })
  }, 'boom', 'no callback & promise throws')
})

test('resolve and reject', function (t) {
  t.plan(6)
  var fn = raco.wrap(function * () {
    return yield Promise.resolve(167)
  })

  // callback
  fn(function (err, val) {
    t.error(err)
    t.equal(val, 167, 'callback value')
  })

  // promise
  fn().then(function (val) {
    t.equal(val, 167, 'promise resolve')
  }, t.error)

  raco.wrap(function * () {
    throw new Error('167')
  })().then(t.error, function (err) {
    t.equal(err.message, '167', 'promise reject')
  })

  raco.wrap(function * () {
    return Promise.reject() // falsy reject
  })(function (err, val) {
    t.ok(err instanceof Error, 167, 'promise falsy reject')
    t.error(val)
  })
})

test('yieldable', function (t) {
  t.plan(6)

  function * resolveGen (n) {
    return yield Promise.resolve(n)
  }
  var rejectFn = raco.wrap(function * (n) {
    return Promise.reject(n)
  })
  var instantCb = function (cb) {
    cb(null, 1044)
  }
  var tryCatch = raco.wrap(function * () {
    try {
      return yield rejectFn(689)
    } catch (err) {
      t.equal(err, 689, 'try/catch promise reject')
      return yield resolveGen(167)
    }
  })
  var tryCatchNext = raco.wrap(function * (next) {
    try {
      return yield next(689)
    } catch (err) {
      t.equal(err, 689, 'try/catch next err')
      return yield next(null, 167)
    }
  })

  raco(function * (next) {
    yield setTimeout(next, 0)
    t.equal(yield function * (next) {
      return yield next(null, 'foo')
    }, 'foo', 'yield generator function')
    t.equal(yield instantCb(next), 1044, 'yield callback')
    t.equal(yield tryCatch(), 167, 'yield gnerator-promise')
    t.equal(yield tryCatchNext(), 167, 'yield next val')
  })
})

test('override yieldable', function (t) {
  t.plan(2)
  raco(function * () {
    t.deepEqual(yield [
      Promise.resolve(1),
      Promise.resolve(2),
      3
    ], [1, 2, 3], 'yield map array to Promise.all')

    try {
      yield 689
    } catch (err) {
      t.equal(err.message, 'DLLM', 'yield 689 throws error')
    }
  }, {
    yieldable: function (val, cb) {
      // yield array
      if (Array.isArray(val)) {
        Promise.all(val).then(function (res) {
          cb(null, res)
        }, function (err) {
          cb(err || new Error())
        })
        return true
      }
      // yield 689 throws error
      if (val === 689) {
        cb(new Error('DLLM'))
        return true
      }
    }
  })
})

test('wrapAll', function (t) {
  t.plan(6)

  var fn = function () {}
  var gen = (function * () {})()
  var obj = {
    test: 'foo',
    fn: fn,
    gen: gen,
    genFn: function * () {
      try {
        yield Promise.reject('booom')
      } catch (e) {
        t.equal(e, 'booom', 'correct yield')
      }
    }
  }
  t.equal(raco.wrapAll(obj), obj, 'mutuable')
  t.equal(obj.test, 'foo', 'ignore non raco')
  t.equal(obj.fn, fn, 'ignore non raco')
  t.notOk(obj.gen === gen, 'wrap generator')
  t.notOk(obj.genFn === fn, 'wrap generator function')
  obj.genFn().catch(t.error)
})
