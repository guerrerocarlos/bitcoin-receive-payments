var tape = require('tape')
var ginga = require('../')

tape('Generator result', function (t) {
  var obj = ginga()
    .define('v', function * (ctx, next) {
      yield setTimeout(next, 0)
      return 1044
    })
    .define('v1', function * () {
      return yield this.v()
    })
    .define('v2', function (ctx) {
      return 167
    })
    .define('f', function * (ctx, next) {
      return (yield this.v1(next)) / 2 + (yield this.v2(next))
    })

  obj.f(function (err, res) {
    t.notOk(err, 'no error')
    t.deepEqual(res, 689, 'correct value')
    t.end()
  })
})

tape('Generator Error', function (t) {
  t.plan(5)

  var obj = ginga()
    .define('v', function * () {
      throw new Error('diu')
    })
    .define('v1', function * () {
      try {
        return yield this.v()
      } catch (err) {
        return 1044
      }
    })
    .define('v2', function (ctx) {
      return 167
    })
    .define('f', function * (ctx, next) {
      return (yield this.v1(next)) / 2 + (yield this.v2(next))
    })

  obj.v(function (err) {
    t.equal(err.message, 'diu', 'v error')
  })
  obj.v1(function (err, res) {
    t.notOk(err, 'v1 no error')
    t.equal(res, 1044, 'v1 correct value')
  })
  obj.f(function (err, res) {
    t.notOk(err, 'f no error')
    t.deepEqual(res, 689, 'f correct value')
  })
})
