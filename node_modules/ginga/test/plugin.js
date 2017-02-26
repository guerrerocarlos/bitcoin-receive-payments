var tape = require('tape')
var ginga = require('../')

function Clock () {
  this._tick = 'tick'
  this._tock = 'tock'
}

function base (ctx, next) {
  ctx.logs = ['clock']
  next()
}
function tick (ctx, next) {
  ctx.logs.push(this._tick)
  next()
}
function tock (ctx, next) {
  ctx.logs.push(this._tock)
  next()
}
function end (ctx, done) {
  ctx.logs.push('done')
  done(null, ctx.logs)
}
ginga(Clock.prototype)
  .define('tick', base, tick, end)
  .define('tock', base, tick, tock, end)

var plugin = ginga()
.use('tick', function (ctx) {
  ctx.logs.push('more')
}, function (ctx, next) {
  ctx.logs.push('and more tick')
  next()
})
.use('tock', function (ctx, next) {
  next('booooom')
})

tape('ginga plugin', function (t) {
  t.plan(8)

  var clock = new Clock()

  clock.tick(function (err, res) {
    t.notOk(err, 'no error')
    t.deepEqual(res, ['clock', 'tick', 'done'])
  })
  clock.tock(function (err, res) {
    t.notOk(err, 'no error')
    t.deepEqual(res, ['clock', 'tick', 'tock', 'done'])
  })

  clock.use(plugin)

  clock.tick(function (err, res) {
    t.notOk(err, 'no error')
    t.deepEqual(res, ['clock', 'tick', 'more', 'and more tick', 'done'])
  })
  clock.tock(function (err, res) {
    t.notOk(res, 'no result')
    t.equal(err, 'booooom', 'return error')
  })
})
