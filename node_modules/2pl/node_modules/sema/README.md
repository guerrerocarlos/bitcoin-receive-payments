# sema

Async semaphore for shared or exclusive execution of JavaScript functions.

[![Build Status](https://travis-ci.org/cshum/sema.svg?branch=master)](https://travis-ci.org/cshum/sema)

```
npm install sema
```

```js
var sema = require('sema')
var s = sema()

// exclusive mode
s.acquire(function () {
  ...
  doReadWrite(function (err) {
    ...
    s.release()
  })
})

// shared mode
s.acquire(sema.SHARED, function () {
  ...
  doReadOnly(function (err) {
    ...
    s.release()
  })
})

```

## API

### var s = sema()
Creates a semaphore instance.

### s.acquire([mode], [fn])
Acquire semaphore. Defaults to exclusive mode. Setting mode `sema.SHARED` to acquire a shared mode.

Callback to asynchronous function `fn` when semaphore available. 
Invoked immediately if semaphore is free or shared only. Otherwise pushed to the wait queue.

Returns a promise if no `fn` provided. However this yields a slight delay when acquiring, due to the nature of promise. If such timing is important then callback function should be used.

### s.release()
Release semaphore.

Invokes function from the wait queue if queue is not empty.

### s.mode()

Returns mode constant, the current state of semaphore.

### Mode Constants

* **`sema.FREE = null`** 
* **`sema.SHARED = 1`** 
* **`sema.EXCLUSIVE = 2`** 
* **`sema.WAIT = 3`** 

## License
MIT
