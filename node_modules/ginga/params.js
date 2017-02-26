var is = require('./is')

function dummy () { return true }

// params parsing middleware
module.exports = function () {
  var args = Array.prototype.slice.call(arguments)
  var spec = []
  var specLen = args.length
  var min = 0
  var i
  for (i = 0; i < specLen; i++) {
    var obj = {}
    var str = args[i]

    var ch = str.slice(-1)
    obj.required = '?'.indexOf(ch) === -1

    if (obj.required) min++

    if ('?'.indexOf(ch) > -1) str = str.slice(0, -1)

    var arg = str.split(':')
    obj.name = arg[0]
    if (arg.length > 1) {
      // defined type
      var check = is[arg[1].toLowerCase()]
      if (typeof check !== 'function') {
        throw new Error('Parameter `' + arg[0] + '`: type `' + arg[1] + '` not exist')
      }
      obj.check = check
    } else {
      obj.check = dummy
    }
    spec.push(obj)
  }
  return function params (ctx, next) {
    var args = ctx.args
    var len = args.length
    var params = {}
    var index = 0
    var offset = 0

    ctx.params = params
    if (len < min) {
      return next(new Error(
        'Too few arguments. Expected at least ' + min
      ))
    }
    while (offset < len && index < specLen) {
      while (
        !spec[index].check(args[offset]) &&
        !spec[index].required
      ) {
        index++
        if (args[offset] === null || args[offset] === undefined) {
          offset++
        }
        if (index >= specLen || offset >= len) {
          return next()
        }
      }
      if (!spec[index].check(args[offset])) {
        return next(new Error(
          'Invalid type on argument `' + args[offset] + '`.'
        ))
      }
      params[spec[index].name] = args[offset]
      index++
      offset++
    }
    next()
  }
}
