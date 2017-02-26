var tape = require('tape')
var ginga = require('../')

tape('end emitter result', function (t) {
  t.plan(10)
  var obj = ginga().define('f', function (ctx, done) {
    ctx.on('end', function (err, res) {
      t.error(err)
      t.deepEqual(res, 'res')
    })
    done(null, 'res')
  })

  obj.f(function (err, res) {
    t.error(err)
    t.deepEqual(res, 'res')
  })

  t.equal(typeof obj.f().then, 'function', 'no cb returns promise')

  obj.f().then(function (res) {
    t.deepEqual(res, 'res')
  }).catch(function (err) {
    t.error(err, 'no error if resolved')
  })
})

tape('end emitter error', function (t) {
  t.plan(10)
  var obj = ginga().define('f', function (ctx, done) {
    ctx.on('end', function (err, res) {
      t.deepEqual(err, 'err')
      t.deepEqual(res, 'res')
    })
    done('err', 'res')
  })

  obj.f(function (err, res) {
    t.deepEqual(err, 'err')
    t.deepEqual(res, 'res')
  })

  t.equal(typeof obj.f().then, 'function', 'no cb returns promise')

  obj.f().then(function (res) {
    t.error(res, 'not resolved if error')
  }).catch(function (err) {
    t.deepEqual(err, 'err')
  })
})
