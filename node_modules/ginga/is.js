var is = module.exports

is.string = function (val) {
  return typeof val === 'string'
}
is.boolean = function (val) {
  return typeof val === 'boolean'
}
is.function = function (val) {
  return typeof val === 'function'
}
is.number = function (val) {
  return typeof val === 'number'
}
is.date = function (val) {
  return Object.prototype.toString.call(val) === '[object Date]'
}
is.regexp = function (val) {
  return Object.prototype.toString.call(val) === '[object RegExp]'
}
is.object = function (val) {
  return typeof val === 'object' && !!val
}
is.array = Array.isArray || function (val) {
  return Object.prototype.toString.call(val) === '[object Array]'
}
is.promise = function (val) {
  return val && typeof val.then === 'function'
}
is.generator = require('is-generator-function')
