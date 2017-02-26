var UrlPattern = require('url-pattern')

module.exports = {
  create: new UrlPattern('/api/v2/create_wallet'),
  login: new UrlPattern('/merchant/:guid/login'),
  payment: new UrlPattern('/merchant/:guid/payment'),
  sendmany: new UrlPattern('/merchant/:guid/sendmany'),
  balance: new UrlPattern('/merchant/:guid/balance'),
  list: new UrlPattern('/merchant/:guid/list'),
  addrBalance: new UrlPattern('/merchant/:guid/address_balance'),
  newAddress: new UrlPattern('/merchant/:guid/new_address'),
  archive: new UrlPattern('/merchant/:guid/archive_address'),
  unarchive: new UrlPattern('/merchant/:guid/unarchive_address'),
  consolidate: new UrlPattern('/merchant/:guid/auto_consolidate')
}
