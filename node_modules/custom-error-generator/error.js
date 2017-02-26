"use strict";
var util = require('util');
/**
 * Create a custom error generator
 *
 * @param   {String}    name        The error name
 * @param   {Object}    parameters  An optional set of key=value pairs to attach to errors
 * @param   {Function}  Constructor      An optional parent Error class to inherit from
 * @return  {Function}
 */
module.exports = function createError (name, parameters, Constructor) {
    if (!name) {
        throw new TypeError('A custom error name is required');
    }
    // Check to make sure we're inheriting from a regular function first
    if (Constructor && typeof Constructor == 'function') {
        // If we're not starting from the Error prototype, add the Error prototype
        // to the Constructor prototype chain
        if (!Error.prototype.isPrototypeOf(Constructor.prototype)) {
            var parentProto = { };
            Object.getOwnPropertyNames(Constructor.prototype).forEach(function (name) {
                parentProto[name] = Object.getOwnPropertyDescriptor(Constructor.prototype, name);
            });
            Constructor.prototype = Object.create(Error.prototype, parentProto);
        }
    // Otherwise simply inherit from the Error built-in
    } else {
        Constructor = Error;
    }
    // If we're given additional parameters, attach them to the created object
    var properties = {};
    if (parameters) {
        Object.keys(parameters).forEach(function (property) {
            properties[property] = {
                'value'        : parameters[property],
                'enumerable'   : true,
                'writable'     : true,
                'configurable' : true
            };
        });
    }
    // Set up the custom properties for this Error object, if specified.
    // Create a new stack descriptor that includes the stacks for any errors
    // also passed in
    function createStackDescriptor (errors, previous) {
        return function () {
            var stack = previous.get();
            errors.forEach(function (error) {
                stack += '\n';
                stack += error.stack;
            });
            return stack;
        };
    }
    // The custom error function that's returned. Since it always creates a new
    // exception, we don't have to worry if itself was invoked with a new
    // operator or not.
    function CustomError (message) {
        // We start by simply creating a new error object, so that we preserve
        // the runtime error logic
        var proxy = new Error(message);
        // We want to call our constructor on the error object itself,
        Constructor.apply(this, arguments);
        // We also want to preserve the inheritance logic in the prototype chain
        Constructor.apply(proxy, arguments);
        // Capture the stack trace at the appropriate stack location
        Error.captureStackTrace(proxy, CustomError);
        // Make a backup of our existing stack descriptor
        var stackDescriptor = Object.getOwnPropertyDescriptor(proxy, 'stack');
        // We now loop through all of the arguments to collect any sub errors,
        // And to allow for custom string formatting with the message
        var errors   = [];
        var messages = [];
        var length   = arguments.length;
        var index    = length;
        while (index--) {
            var param = arguments[length - index - 1];
            if (param instanceof Error) {
                errors.push(param);
            } else if (typeof param == 'string' || typeof param == 'number') {
                messages.push(param);
            }
        }
        // If we have any errors that were passed in, replace the stack
        // descriptor that includes the other error stacks
        if (errors.length > 0) {
            properties.stack = {
                'get' : createStackDescriptor(errors, stackDescriptor)
            };
        }
        // Always set the message manually, in case there was a default supplied
        // format with util.format
        properties.message = {
            'value' : util.format.apply(null, messages)
        };
        // Pass in our extra properties
        Object.defineProperties(proxy, properties);
        // Replace the error prototype with our own
        proxy.__proto__ = Object.create(CustomError.prototype, properties);
        return proxy;
    }
    // Set up the new prototype
    var proto = {
        'constructor'      : {
            'value'        : CustomError,
            'writable'     : true,
            'configurable' : true
        },
        'name'             : {
            'value'        : name,
            'enumerable'   : false,
            'writable'     : true,
            'configurable' : true
        },
        'toJSON'           : {
            'enumerable'   : false,
            'configurable' : false,
            'value'        : function () {
                var json =  {};
                Object.getOwnPropertyNames(this).forEach(function (name) {
                    json[name] = name == 'stack' ? this[name].split('\n') : this[name];
                }, this);
                return json;
            }
        }
    };
    // Also set the passed in parameters on the prototype if it's inherited later
    if (parameters) {
        Object.keys(parameters).forEach(function (name) {
            proto[name] = {
                'value' : parameters[name],
                'enumerable'   : true,
                'writable'     : true,
                'configurable' : true
            };
        });
    }
    // Copying from the Error prototype allows us to preserve the built-in error checks
    CustomError.prototype = Object.create(Constructor.prototype, proto);
    return CustomError;
};
