var UrlPattern = require('url-pattern')

module.exports = {
  rawblock: new UrlPattern('/rawblock/:hash(?api_code=:apiCode)'),
  rawtx: new UrlPattern('/rawtx/:hash(?api_code=:apiCode)'),
  blockHeight: new UrlPattern('/block-height/:height?format=json(&api_code=:apiCode)'),
  address: new UrlPattern('/address/:address?format=json(&limit=:limit)(&offset=:offset)(&api_code=:apiCode)'),
  multiaddr: new UrlPattern('/multiaddr?active=:active(&n=:limit)(&offset=:offset)(&api_code=:apiCode)'),
  unspent: new UrlPattern('/unspent?active=:active(&api_code=:apiCode)'),
  latestblock: new UrlPattern('/latestblock(?api_code=:apiCode)'),
  unconfTxs: new UrlPattern('/unconfirmed-transactions?format=json(&api_code=:apiCode)'),
  blocks: new UrlPattern('/blocks/:time?format=json(&api_code=:apiCode)'),
  inv: new UrlPattern('/inv/:hash?format=json(&api_code=:apiCode)')
}
