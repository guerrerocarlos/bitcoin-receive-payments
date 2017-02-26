node-custom-error
===================
[![Build Status](https://travis-ci.org/jproulx/node-custom-error.svg?branch=master)](https://travis-ci.org/jproulx/node-custom-error)[![devDependency Status](https://david-dm.org/jproulx/node-custom-error/dev-status.svg)](https://david-dm.org/jproulx/node-custom-error#info=devDependencies)[![Code Climate](https://codeclimate.com/github/jproulx/node-custom-error.png)](https://codeclimate.com/github/jproulx/node-custom-error)[![CodeClimate](https://codeclimate.com/github/jproulx/node-custom-error/coverage.png)](https://codeclimate.com/github/jproulx/node-custom-error)[![Coverage Status](https://coveralls.io/repos/jproulx/node-custom-error/badge.png?branch=master)](https://coveralls.io/r/jproulx/node-custom-error?branch=master)

[![NPM](https://nodei.co/npm/custom-error-generator.png)](https://nodei.co/npm/custom-error-generator/)

Custom errors and exceptions in Node.js

## Install

```bash
$ npm install custom-error-generator --save
```

## Usage

```javascript
var createCustomError = require('custom-error-generator');
var ValidationError = createCustomError('ValidationError', { 'required', 'Missing parameter x' }, TypeError);
var HTTPError = createCustomError('HTTPError', { 'code' : 500, 'status' : 'Server Error' });

throw new ValidationError('Required');
```

The generator function supports the following parameters:

* `name` {String} (required) - A custom name for this error type, which is printed when logging and in stack traces

* `data` {Object} (optional) - Additional properties to attach to the error, in key=value pairs or as object descriptors

* `Constructor` {Function} (optional) - A function to inherit from. Allows for additional methods and properties to be defined on your custom errors

The errors created by the generated functions are identical to built-in Error objects, with additional features such as:

Custom properties can be attached and accessed at run time:
```javascript
var error = new HTTPError('Uh oh');
console.log(error.code, error.status); // prints 500 Server Error
```

## Formatting

Similar to `console.log`, the custom error message will be formatted from all available string and number arguments, using `util.format`:
```javascript
var error = new ValidationError('%s: %s', 'Missing Field', 'name');
console.log(error); // prints ValidationError: Missing Field: name
```

## Wrapped errors

Other error objects can be passed in as arguments, which augment the original error stack trace with their own stack traces:
```javascript
var error = new ValidationError('Missing field');
var serverError = new HTTPError('Something went wrong', error);
console.log(serverError.stack);
```
outputs:
```bash
HTTPError: Something went wrong
    at Context.<anonymous> (/Projects/node-custom-error/test.js:19:24)
    at callFn (/Projects/node-custom-error/node_modules/mocha/lib/runnable.js:223:21)
    at Hook.Runnable.run (/Projects/node-custom-error/node_modules/mocha/lib/runnable.js:216:7)
    at next (/Projects/node-custom-error/node_modules/mocha/lib/runner.js:259:10)
    at Object._onImmediate (/Projects/node-custom-error/node_modules/mocha/lib/runner.js:276:5)
    at processImmediate [as _immediateCallback] (timers.js:330:15)
ValidationError: Missing field
    at Context.<anonymous> (/Projects/node-custom-error/test.js:18:24)
    at callFn (/Projects/node-custom-error/node_modules/mocha/lib/runnable.js:223:21)
    at Hook.Runnable.run (/Projects/node-custom-error/node_modules/mocha/lib/runnable.js:216:7)
    at next (/Projects/node-custom-error/node_modules/mocha/lib/runner.js:259:10)
    at Object._onImmediate (/Projects/node-custom-error/node_modules/mocha/lib/runner.js:276:5)
    at processImmediate [as _immediateCallback] (timers.js:330:15)
```
Multiple error objects are allowed to be passed, and are processed in order.

## JSON support
Errors can also be serialized into JSON format by using `error#toJSON();`. This will enumerate all of the hidden and custom properties, and also format the stack trace into an array of individual lines:

```javascript
console.log(error.toJSON()); // or console.log(JSON.stringify(error));
```
outputs
```bash
{ stack:
   [ 'ValidationError: Missing field',
     '    at Context.<anonymous> (/Projects/node-custom-error/test.js:17:24)',
     '    at callFn (/Projects/node-custom-error/node_modules/mocha/lib/runnable.js:223:21)',
     '    at Hook.Runnable.run (/Projects/node-custom-error/node_modules/mocha/lib/runnable.js:216:7)',
     '    at next (/Projects/node-custom-error/node_modules/mocha/lib/runner.js:259:10)',
     '    at Object._onImmediate (/Projects/node-custom-error/node_modules/mocha/lib/runner.js:276:5)',
     '    at processImmediate [as _immediateCallback] (timers.js:330:15)' ],
  arguments: undefined,
  type: undefined,
  required: 'Missing parameter x',
  message: 'Missing Field' }
```

## Custom Constructor
Finally, a custom function can be passed in as a 3rd argument. This will allow you to modify the custom error prototype without having to modify the original native Error prototype:

```javascript
var HTTPError = createCustomError('HTTPError', null, function (message, code) {
    var http = require('http');
    // Set custom properties when thrown based on additional arguments
    this.code = code;
    this.status = http.STATUS_CODES[code];
    // We can override the default message logic if desired:
    this.message = message;
});
var error = new HTTPError('You do not have permission', 403);
console.log(error, [error.code, error.status]);
// result: HTTPError: You do not have permission [ 403, "Forbidden" ]
```

## Notes
Care is taken to preserve the built-in error handling behavior as much as possible, supporting:

* `custom instanceOf Error`

* `Error.prototype.isPrototypeOf(custom)`

* `util.isError(custom)`

* `custom = generator('message')`

* `custom = new generator('message');`

In other words, you shouldn't have to worry about these errors affecting your syntax or existing code. Simply drop in place for any existing errors you're throwing and it should work just the same.
