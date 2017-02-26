var is = require('./is')

module.exports = function flatten (arr, res) {
  if (!res) {
    res = []
  }
  for (var i = 0, l = arr.length; i < l; i++) {
    if (arr[i] && is.array(arr[i])) {
      flatten(arr[i], res)
    } else {
      res.push(arr[i])
    }
  }
  return res
}
