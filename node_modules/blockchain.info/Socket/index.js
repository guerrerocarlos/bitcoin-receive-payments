var EventEmitter = require('events')
var util = require('util')
var WebSocket

try {
  WebSocket = require('ws')
  module.exports = Socket
} catch (e) {
  var wsErrMsg = 'Cannot create Socket object, module `ws` was not installed correctly'
  module.exports = function () { throw new Error(wsErrMsg) }
}

util.inherits(Socket, EventEmitter)

function Socket () {
  EventEmitter.call(this)
  var wsUrl = 'wss://ws.blockchain.info/inv'
  var socket = new WebSocket(wsUrl)
  this.close = socket.close.bind(socket)
  this.getReadyState = function () { return socket.readyState }

  this.op = function (op, data) {
    var message = JSON.stringify(extend({ op: op }, data || {}))
    var send = socket.send.bind(socket, message)
    if (socket.readyState === WebSocket.CONNECTING) socket.on('open', send)
    else if (socket.readyState === WebSocket.OPEN) send()
  }

  socket.on('message', function (message) {
    message = JSON.parse(message)
    this.emit(message.op, message.x)
  }.bind(this))

  socket.on('open', this.emit.bind(this, 'open'))
  socket.on('close', this.emit.bind(this, 'close'))
  socket.on('error', this.emit.bind(this, 'error'))
}

Socket.prototype.subscribe = function (sub, options) {
  this.op(sub, options)
  return this
}

Socket.prototype.onOpen = function (callback) {
  this.on('open', callback)
  return this
}

Socket.prototype.onClose = function (callback) {
  this.on('close', callback)
  return this
}

Socket.prototype.onTransaction = function (callback, options) {
  options = options || {}
  if (options.addresses instanceof Array) {
    options.addresses.forEach(function (addr) {
      this.op('addr_sub', { addr: addr })
    }, this)
  } else {
    this.op('unconfirmed_sub')
  }
  if (options.setTxMini) {
    this.op('set_tx_mini')
  }
  this.on('utx', callback)
  this.on('minitx', callback)
  return this
}

Socket.prototype.onBlock = function (callback) {
  this.op('blocks_sub')
  this.on('block', callback)
  return this
}

function extend (o, p) {
  for (var prop in p) {
    if (!o.hasOwnProperty(prop)) {
      o[prop] = p[prop]
    }
  }
  return o
}
