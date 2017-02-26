var is = require('./is')
var flatten = require('./flatten')
var EventEmitter = require('events').EventEmitter
var params = require('./params')
var raco = require('raco')

// wrap ginga middleware function
function wrapFn (gen) {
  if (!is.function(gen)) throw new Error('Middleware must be a function')
  if (!is.generator(gen)) return gen

  // wrap generator with raco
  var fn = raco.wrap(gen)
  return function (ctx, next) {
    fn.call(this, ctx, next)
  }
}

// ginga use method
function use () {
  // init hooks
  if (!this.hasOwnProperty('_hooks')) {
    this._hooks = {}
  }

  var args = Array.prototype.slice.call(arguments)
  var i, j, l, m
  var name = null

  if (is.array(args[0])) {
    // use(['a','b','c'], ...)
    var arr = args.shift()
    for (i = 0, l = arr.length; i < l; i++) {
      use.apply(this, [arr[i]].concat(args))
    }
    return this
  } else if (is.object(args[0]) && args[0]._hooks) {
    // use(ginga)
    var key
    // concat hooks
    for (key in args[0]._hooks) {
      use.call(this, key, args[0]._hooks[key])
    }
    return this
  }

  // method name
  if (is.string(args[0])) name = args.shift()
  if (!name) throw new Error('Method name is not defined.')
  if (!this._hooks[name]) this._hooks[name] = []

  for (i = 0, l = args.length; i < l; i++) {
    if (is.function(args[i])) {
      this._hooks[name].push(wrapFn(args[i]))
    } else if (is.array(args[i])) {
      // use('a', [fn1, fn2, fn3])
      for (j = 0, m = args[i].length; j < m; j++) {
        use.call(this, name, args[i][j])
      }
      return this
    } else {
      throw new Error('Middleware must be a function')
    }
  }
  return this
}

// ginga define method
function define () {
  var args = Array.prototype.slice.call(arguments)
  var i, l

  var name = args.shift()
  if (is.array(name)) {
    name = args.shift()
    for (i = 0, l = name.length; i < l; i++) {
      define.apply(this, [name[i]].concat(args))
    }
    return this
  }

  if (!is.string(name)) throw new Error('Method name is not defined')

  var invoke = is.function(args[args.length - 1]) ? wrapFn(args.pop()) : null
  var pre = args.map(wrapFn)

  // define scope method
  this[name] = function () {
    var args = Array.prototype.slice.call(arguments)
    var self = this
    var callback

    if (is.function(args[args.length - 1])) callback = args.pop()

    // init pipeline
    var pipe = []
    var obj = this

    // prototype chain
    while (obj) {
      if (obj.hasOwnProperty('_hooks') && obj._hooks[name]) {
        pipe.unshift(obj._hooks[name])
      }
      obj = Object.getPrototypeOf(obj)
    }
    // pre middlewares
    pipe.unshift(pre)

    // invoke middleware
    if (invoke) pipe.push(invoke)

    pipe = flatten(pipe)

    // context object and next triggerer
    var ctx = new EventEmitter()
    ctx.method = name
    ctx.args = args
    var index = 0
    var size = pipe.length

    function next (err, res) {
      if (err || index === size) {
        var args = Array.prototype.slice.call(arguments)
        // callback when err or end of pipeline
        if (callback) callback.apply(self, args)
        args.unshift('end')
        ctx.emit.apply(ctx, args)
      } else if (index < size) {
        var fn = pipe[index]
        index++
        var val = fn.call(self, ctx, next)
        if (is.promise(val)) {
          val.then(function (res) {
            next(null, res)
          }, function (err) {
            next(err || new Error())
          })
        } else if (fn.length < 2) {
          // args without next() & not promise, sync func
          next(null, val)
        }
      }
    }

    if (callback) {
      next()
    } else {
      // use promise if no callback
      return new Promise(function (resolve, reject) {
        callback = function (err, result) {
          if (err) return reject(err)
          resolve(result)
        }
        next()
      })
    }
  }
  return this
}

function ginga (scope) {
  scope = scope || {}
  scope.use = use
  scope.define = define

  return scope
}

ginga.use = use
ginga.define = define
ginga.params = params

module.exports = ginga
