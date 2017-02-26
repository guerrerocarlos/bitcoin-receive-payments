var BitcoinGateway = require('./index')

var pub_key = 'xpub6CV... extended public key (xPub)'
var openexchangerates_key = 'd1c95b7b... openexchangerates.org KEY'

var gateway = new BitcoinGateway(pub_key, openexchangerates_key)

var EXAMPLE_ID = '5554555'

gateway.events.on('initialized', function() {
  console.log('gateway has been intialized.')
  gateway.createAddress(EXAMPLE_ID)
    .then(function(address) {
      console.log('got new address', address.address, ' and it has', address.seconds_left / 60, 'minutes left.')
      var amount = 3.99
      console.log('will ask user ', amount, 'USD in it as', gateway.USDtoBIT(amount) + ' bits, using HTML, preferably as a QR code')
    }).catch(function() {
      console.log('limit reached! cant get a new address :(')
    })
})

gateway.events.on('payment', function(payment) {
  console.log('got a payment on one of our addresses!.', payment)
})

gateway.connect()