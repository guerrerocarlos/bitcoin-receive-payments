var inherits = require('inherits')
var native = require('./native')

function TfTypeError (type, value, valueTypeName) {
  this.__error = Error.call(this)
  this.__type = type
  this.__value = value
  this.__valueTypeName = valueTypeName

  var message
  Object.defineProperty(this, 'message', {
    enumerable: true,
    get: function () {
      if (message) return message

      valueTypeName = valueTypeName || getValueTypeName(value)
      message = tfErrorString(type, value, valueTypeName)

      return message
    }
  })
}

function TfPropertyTypeError (type, property, label, value, error, valueTypeName) {
  this.__error = error || Error.call(this)
  this.__label = label
  this.__property = property
  this.__type = type
  this.__value = value
  this.__valueTypeName = valueTypeName

  var message
  Object.defineProperty(this, 'message', {
    enumerable: true,
    get: function () {
      if (message) return message
      if (type) {
        valueTypeName = valueTypeName || getValueTypeName(value)
        message = tfPropertyErrorString(type, label, property, value, valueTypeName)
      } else {
        message = 'Unexpected property "' + property + '"'
      }

      return message
    }
  })
}

// inherit from Error, assign stack
[TfTypeError, TfPropertyTypeError].forEach(function (tfErrorType) {
  inherits(tfErrorType, Error)
  Object.defineProperty(tfErrorType, 'stack', {
    get: function () { return this.__error.stack }
  })
})

function tfCustomError (expected, actual) {
  return new TfTypeError(expected, {}, actual)
}

function tfSubError (e, property, label) {
  // sub child?
  if (e instanceof TfPropertyTypeError) {
    property = property + '.' + e.__property
    label = e.__label

    return new TfPropertyTypeError(
      e.__type, property, label, e.__value, e.__error, e.__valueTypeName
    )
  }

  // child?
  if (e instanceof TfTypeError) {
    return new TfPropertyTypeError(
      e.__type, property, label, e.__value, e.__error, e.__valueTypeName
    )
  }

  return e
}

function getTypeName (fn) {
  return fn.name || fn.toString().match(/function (.*?)\s*\(/)[1]
}

function getValueTypeName (value) {
  return native.Null(value) ? '' : getTypeName(value.constructor)
}

function getValue (value) {
  if (native.Function(value)) return ''
  if (native.String(value)) return JSON.stringify(value)
  if (value && native.Object(value)) return ''
  return value
}

function tfJSON (type) {
  if (native.Function(type)) return type.toJSON ? type.toJSON() : getTypeName(type)
  if (native.Array(type)) return 'Array'
  if (type && native.Object(type)) return 'Object'

  return type !== undefined ? type : ''
}

function tfErrorString (type, value, valueTypeName) {
  var valueJson = getValue(value)

  return 'Expected ' + tfJSON(type) + ', got' +
    (valueTypeName !== '' ? ' ' + valueTypeName : '') +
    (valueJson !== '' ? ' ' + valueJson : '')
}

function tfPropertyErrorString (type, label, name, value, valueTypeName) {
  var description = '" of type '
  if (label === 'key') description = '" with key type '

  return tfErrorString('property "' + tfJSON(name) + description + tfJSON(type), value, valueTypeName)
}

module.exports = {
  TfTypeError: TfTypeError,
  TfPropertyTypeError: TfPropertyTypeError,
  tfCustomError: tfCustomError,
  tfSubError: tfSubError,
  tfJSON: tfJSON,
  getValueTypeName: getValueTypeName
}
