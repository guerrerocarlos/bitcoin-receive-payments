var setImmediate = global.setImmediate || process.nextTick

function Semaphore (cap) {
  if (!(this instanceof Semaphore)) return new Semaphore(cap)
  this._q = []
  this._taken = 0
  this._cap = cap || 1
}

Semaphore.prototype.take = function (fn) {
  if (this._taken < this._cap) {
    this._taken++
    setImmediate(fn)
  } else {
    this._q.push(fn)
  }
  return this
}

Semaphore.prototype.leave = function () {
  if (this._q.length > 0) {
    setImmediate(this._q.shift())
  } else {
    if (this._taken === 0) {
      throw new Error('Too many release.')
    }
    this._taken--
  }
  return this
}

module.exports = Semaphore
