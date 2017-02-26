# raco

Generator based flow-control that supports both callback and promise.

[![Build Status](https://travis-ci.org/cshum/raco.svg?branch=master)](https://travis-ci.org/cshum/raco)

```bash
npm install raco
```

Many existing flow-control libraries such as [co](https://github.com/tj/co), assume promises to be the lowest denominator of async handling.
Callback function requires promisify patch to be compatible, 
which creates unnecessary complication. 

In raco, both callbacks and promises are yieldable.
Resulting function can be called by both callbacks and promises.
This enables a powerful control flow while maintaining simplicity.

### `raco(fn*, [opts])`

Resolves a generator function.
This does not return a Promise; uncaught error will be thrown.

```js
// import raco
var raco = require('raco')
...
raco(function * (next) {
  // yield promise
  console.log(yield Promise.resolve('foo')) // 'foo'
  try {
    yield Promise.reject('boom')
  } catch (err) {
    console.log(err) // 'boom'
  }

  // yield callback
  yield setTimeout(next, 1000) // delay 1 second
  var data = yield fs.readFile('./data', next)  
  yield mkdirp('/tmp/foo/bar', next)
  yield pump(
    fs.createReadStream('./foo'),
    fs.createWriteStream('./bar'),
    next
  )
})
```

Yieldable callback works by supplying an additional `next` argument. 
Yielding non-yieldable value pauses the current generator, 
until `next(err, val)` being invoked by callback.
`val` passes back to yielded value, or `throw` if `err` exists.

```js
raco(function * (next) {
  var res = yield setTimeout(function () { 
    next(null, 'foo')
  }, 100)
  console.log(res) // 'foo'

  try {
    yield setTimeout(function () { 
      next(new Error('boom'))
    }, 100)
  } catch (err) {
    console.log(err.message) // 'boom'
  }
})
```

### `fn = raco.wrap(fn*, [opts])`

Wraps a generator function into regular function that optionally accepts callback or returns a promise.

```js
var fn = raco.wrap(function * (arg1, arg2, next) {
  // pass arguments followed by `next`
  ...
  return arg1 + arg2
})

fn(167, 199, (err, val) => { ... }) // Use with callback

fn(167, 689) // use with promise
  .then((val) => { ... })
  .catch((err) => { ... })
```

### `raco.wrapAll(obj, [opts])`

Wraps generator function properties of object.

```js
function App () { }

App.prototype.fn = function * (next) {...}
App.prototype.fn2 = function * (next) {...}

// wrap prototype object
raco.wrapAll(App.prototype)

var app = new App()

app.fn((err, val) => {...})
app.fn2().then(...).catch(...)
```

### Options

Calling raco with options object makes a factory function with a set of available options:

```js
var raco = require('raco')({ 
  Promise: null, // disable Promise
  yieldable: function (val, cb) {
    // custom yieldable
  },
  prepend: true // prepend or append `next` argument
})

```

#### `opts.Promise`

Raco uses native promise by default. This can be overridden by setting `raco.Promise`.

```js
var raco = require('raco')({ Promise: require('bluebird') })
```

#### `opts.prepend`

By default, `next(err, val)` function appends to arguments `fn* (args..., next)`. 
If `opts.prepend` set to `true`, generator function is called with `fn* (next, args...)`.
This can be useful for functions that accept varying numbers of arguments.

```js
var raco = require('raco')

var fn = raco.wrap(function * (next, a, b) {
  return a + b
}, { prpend: true })

fn(1, 6, (err, val) => {
  console.log(val) // 7
})
fn(1, 6).then((val) => {
  console.log(val) // 7
})

```

#### `opts.yieldable`

By default, the following objects are considered yieldable:
* Promise
* Generator
* Generator Function
* Thunk

It is also possible to override the default yieldable mapper. Use with caution:
* Takes the yielded value, returns `true` to acknowledge yieldable.
* Callback`cb(err, val)` to resolve the yieldable.

```js
var raco = require('raco')({
  yieldable: (val, cb) => {
    // map array to Promise.all
    if (Array.isArray(val)) {
      Promise.all(val).then(function (res) {
        cb(null, res)
      }, cb)
      return true // acknowledge yieldable
    }
    // Anything can be mapped!
    if (val === 689) {
      cb(new Error('DLLM'))
      return true // acknowledge yieldable
    }
    return false // acknowledge non-yieldable
  }
})

raco(function * () {
  console.log(yield [
    Promise.resolve(1),
    Promise.resolve(2),
    3
  ]) // [1, 2, 3]

  // yield 689 throws error
  try {
    yield 689
  } catch (err) {
    console.log(err.message) // 'DLLM'
  }
})

```

## License

MIT
