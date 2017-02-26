# Ginga.js

Middleware based control flow for defining async JavaScript methods using callback, promise or generator.

[![Build Status](https://travis-ci.org/cshum/ginga.svg?branch=master)](https://travis-ci.org/cshum/ginga)

```
npm install ginga
```

#### ginga([object])
Initialise `ginga`

```js
var ginga = require('ginga')
var obj = ginga() //as a new object

var app = {}
ginga(app) //as a mixin

function App () { }
ginga(App.prototype) //as a prototype mixin
```

### Method and Hook

#### app.define(name, [pre...], invoke)

Creates an async `name` method that supports both callback and promise. See examples below.

#### app.use(name, [hook...])

Inject additional middleware between `pre` and `invoke` of method `name`. See examples below.

### Middleware

Middleware turns asynchronous functions into encapsulated, reusable set of building blocks. 
Upon calling a method, Ginga method goes through a sequence of middleware functions with following arguments:

* `ctx` - context event emitter object:
  * Maintains state throughout the method call, while encapsulated from `this` object.
  * A middleware can make changes to context object, or access changes made by previous middleware.
  * Emits `end` event with error and result arguments.
* `next` - optional stepping function using callback, which ends the sequence if callback with error argument.

Ginga middleware can be created using callback, promise or generator, interchangeably:

#### Callback

```js
var ginga = require('ginga')
var app = ginga()

// define method
app.define('test', function (ctx, next) {
  setTimeout(function () {
    ctx.logs = ['pre']
    next() // next middleware callback
  }, 1000)
}, function (ctx) {
  // not passing next argument: treated as synchronous call 
  ctx.logs.push('invoke')
  return ctx.logs // returns value of the end of middleware sequence
})

// hook
app.use('test', function (ctx) {
  ctx.logs.push('hook')
})

// method call with callback function
app.test(function (err, res) {
  console.log(res) // ['pre', 'hook', 'invoke']
})

```

#### Promise

By returning promise, value will be resolved before passing to next middleware or returning result. Promise reject ends the middleware sequence.

```js
var ginga = require('ginga')
var app = ginga()

// define method
app.define('test', function (ctx) {
  return fnAsync().then(function (data) {
    // do stuff
  })
}, function (ctx) {
  // returns result from last promise resolve
  return fn2Async()
})

// method call with promise
app.test().then(...).catch(...)
```

#### Generator

In ES6 generators, functions can be paused and resumed using the `yield` keyword. 
Using [caco](https://github.com/cshum/caco), both promise and callback are 'yieldable' in ginga middleware. 
This enables powerful control flow while maintaining compatibility.

```js
var ginga = require('ginga')
var app = ginga()

app.define('test', function * (ctx, next) {
  var foo = yield Promise.resolve('bar') // Promise is yieldable
  yield setTimeout(next, 100) // callback based function is also yieldable
  try {
    ctx.key = yield fs.readfile('./foo/bar', next)
  } catch (err) {
    ctx.key = 'whatever'
  }
}, function (ctx) * {
  // returns result
  return yield db.get(ctx.key)
})
```

#### ginga.params([param...])

Ginga built in `ginga.params` middleware for parsing method arguments. Supports optional parameters and type-checking.
`param` is string in form of

`name[:type][?]`

* `name` - name of parameter mapped from argument
* `type` type checking (optional): `string`, `boolean`, `function`, `number`, `date`, `regexp`, `object`, `array`, case insensitive.
* `?` - optional parameter.

```js
var ginga = require('ginga')
var params = ginga.params

var app = ginga()

//define method with params parsing
app.define('test', params('a', 'b:number?', 'c:string?'), function (ctx) {
  return ctx.params
})

//call method
app.test('s', 1, function (err, res) {
  console.log(res) //{ a: 's', b: 1 }
})
app.test('s', 't', function (err, res) {
  console.log(res) //{ a: 's', c: 't' }
})
app.test(function (err, res) {
  console.log(err) //Error: Too few arguments. Expected at least 1
})
```

### Plugin

#### app.use(plugin)

`app.use` also accepts Ginga object as plugin. This will mount hooks into the main app.

```js
var ginga = require('ginga')

//define app
var app = ginga() 
app.define('test', function (ctx) {
  ctx.logs = ['pre']
}, function (ctx) {
  ctx.logs.push('invoke')
  return ctx.logs
})

//define plugin
var plugin = ginga()
plugin.use('test', function (ctx, next) {
  ctx.logs.push('plugin')
  next()
})

//use plugin
app.use(plugin)

//call methods
app.test(function (err, res) {
  console.log(res) //['pre','plugin', 'invoke']
})
```

### Inheritance
By initialising Ginga with prototype mixin, hooks are also inherited in prototype chain:

```js
var ginga = require('ginga')

function App () { }
var A = ginga(App.prototype) //ginga prototype mixin

A.define('test', function (ctx, next) {
  ctx.logs = ['pre']
  next()
}, function (ctx, done) {
  ctx.logs.push('invoke')
  done(null, ctx.logs)
})

var a1 = new App()
var a2 = new App()

//prototype hook
A.use('test', function (ctx) {
  ctx.logs.push('A hook')
})

//instance hook
a1.use('test', function (ctx) {
  ctx.logs.push('a1 hook')
})
a2.use('test', function (ctx) {
  ctx.logs.push('a2 hook')
})

//call methods
a1.test(function (err, res) {
  console.log(res) //['pre','A hook','a1 hook', 'invoke']
})
a2.test(function (err, res) {
  console.log(res) //['pre','A hook','a2 hook', 'invoke']
})

```


## License

MIT
