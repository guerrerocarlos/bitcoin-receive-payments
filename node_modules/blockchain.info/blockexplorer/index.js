var API = require('../api')
var endpoints = require('./endpoints')
var api = new API('https://blockchain.info', endpoints)

module.exports = {
  getBlock: getBlock,
  getTx: getTx,
  getBlockHeight: getBlockHeight,
  getAddress: getAddress,
  getMultiAddress: getMultiAddress,
  getUnspentOutputs: getUnspentOutputs,
  getLatestBlock: getLatestBlock,
  getUnconfirmedTx: getUnconfirmedTx,
  getBlocks: getBlocks,
  getInventoryData: getInventoryData
}

function getBlock (blockHash, options) {
  options = options || {}
  return api.request('rawblock', { hash: blockHash, apiCode: options.apiCode })
}

function getTx (txHash, options) {
  options = options || {}
  return api.request('rawtx', { hash: txHash, apiCode: options.apiCode })
}

function getBlockHeight (blockHeight, options) {
  options = options || {}
  return api.request('blockHeight', { height: blockHeight, apiCode: options.apiCode })
}

function getAddress (address, options) {
  options = options || {}
  var params = { address: address, limit: options.limit, offset: options.offset, apiCode: options.apiCode }
  return api.request('address', params)
}

function getMultiAddress (addresses, options) {
  options = options || {}
  addresses = (addresses instanceof Array ? addresses : [addresses]).join('|')
  var params = { active: addresses, limit: options.limit, offset: options.offset, apiCode: options.apiCode }
  return api.request('multiaddr', params)
}

function getUnspentOutputs (addresses, options) {
  options = options || {}
  addresses = (addresses instanceof Array ? addresses : [addresses]).join('|')
  return api.request('unspent', { active: addresses, apiCode: options.apiCode })
}

function getLatestBlock (options) {
  options = options || {}
  return api.request('latestblock', options)
}

function getUnconfirmedTx (options) {
  options = options || {}
  return api.request('unconfTxs', options)
}

function getBlocks (time, options) {
  options = options || {}
  return api.request('blocks', { time: time, apiCode: options.apiCode })
}

function getInventoryData (hash, options) {
  options = options || {}
  return api.request('inv', { hash: hash, apiCode: options.apiCode })
}
