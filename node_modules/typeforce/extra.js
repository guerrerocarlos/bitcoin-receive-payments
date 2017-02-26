var errors = require('./errors')

function _Buffer (value) {
  return Buffer.isBuffer(value)
}
_Buffer.toJSON = function () { return 'Buffer' }

function _BufferN (length) {
  function BufferN (value) {
    if (!Buffer.isBuffer(value)) return false
    if (value.length !== length) {
      throw errors.tfCustomError('Buffer(Length: ' + length + ')', 'Buffer(Length: ' + value.length + ')')
    }

    return true
  }
  BufferN.toJSON = function () { return 'Buffer' }

  return BufferN
}

function Hex (value) {
  return typeof value === 'string' && /^([0-9a-f]{2})+$/i.test(value)
}

function _HexN (length) {
  function HexN (value) {
    if (!Hex(value)) return false
    if (value.length !== length) {
      throw errors.tfCustomError('Hex(Length: ' + length + ')', 'Hex(Length: ' + value.length + ')')
    }

    return true
  }
  HexN.toJSON = function () { return 'Hex' }

  return HexN
}

var UINT53_MAX = Math.pow(2, 53) - 1

function Finite (value) {
  return typeof value === 'number' && isFinite(value)
}
function Int8 (value) { return ((value << 24) >> 24) === value }
function Int16 (value) { return ((value << 16) >> 16) === value }
function Int32 (value) { return (value | 0) === value }
function UInt8 (value) { return (value & 0xff) === value }
function UInt16 (value) { return (value & 0xffff) === value }
function UInt32 (value) { return (value >>> 0) === value }
function UInt53 (value) {
  return typeof value === 'number' &&
    value >= 0 &&
    value <= UINT53_MAX &&
    Math.floor(value) === value
}

module.exports = {
  Buffer: _Buffer,
  BufferN: _BufferN,
  Finite: Finite,
  Hex: Hex,
  HexN: _HexN,
  Int8: Int8,
  Int16: Int16,
  Int32: Int32,
  UInt8: UInt8,
  UInt16: UInt16,
  UInt32: UInt32,
  UInt53: UInt53
}
