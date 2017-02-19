var util = require('util')
var EventEmitter = require('events').EventEmitter;
var BLT = require("bitcoin-live-transactions")
var bitcore = require('bitcore-lib');
var HDPublicKey = bitcore.HDPublicKey;
var Address = bitcore.Address;
var Networks = bitcore.Networks;
var Socket = require('blockchain.info/Socket')
var seconds_in_cache_15 = 60 * 15
var seconds_in_cache_14 = 60 * 14
var seconds_in_cache_10 = 60 * 10
var seconds_in_cache_5 = 60 * 5
var redis = require('redis');
var client = redis.createClient();
var max_gap = 15
var debugbrp = require('debug')('brp')
var debugaddress = require('debug')('brp:address')
var colors = require('colors')
var RatesApi = require('openexchangerates-api');

var set_address_in_use = function(address, id) {
  debugaddress(colors.yellow('<set_address_in_use>', address, id))
  return new Promise(function(Success, R) {
    client.set('address-' + address, id, function(err, reply) {
      //   debugaddress(err, reply)
      client.expireat('address-' + address, parseInt((+new Date) / 1000) + seconds_in_cache_15); // delete after 15 minutes
    });
    client.set('address-expiration-' + address, parseInt((+new Date) / 1000) + seconds_in_cache_15, function(err, reply) {
      //   debugaddress(err, reply)
      client.expireat('address-' + address, parseInt((+new Date) / 1000) + seconds_in_cache_15); // delete after 15 minutes
    });
    client.set('id-' + id, address, function(err, reply) {
      //   debugaddress(err, reply)
      client.expireat('id-' + id, parseInt((+new Date) / 1000) + seconds_in_cache_10);
      Success(reply)
    });
  })
}
var seconds_left_for_address = function(address) {
  debugaddress(colors.yellow('<seconds_left_for_address>', address))
  return new Promise(function(Success, Reject) {
    client.get('address-expiration-' + address, function(err, reply) {
      debugaddress(colors.cyan('<seconds_left_for_address>:reply', reply))

      if (reply != undefined) {
        Success(reply)
      } else {
        Reject();
      }
    });
  })
}

var id_has_address_assigned = function(id) {
  debugaddress(colors.yellow('<id_has_address_assigned>', id))
  return new Promise(function(Success, Reject) {
    client.get('id-' + id, function(err, reply) {
      debugaddress(colors.cyan('<id_has_address_assigned>', id, ':reply', reply))
      if (reply === null) {
        debugaddress(colors.red('Rejecting!'))
        Reject();
      } else {
        debugaddress(colors.green('success!', reply))
        Success(reply)
      }
    });
  })
}

var id_assigned_to_address = function(address) {
  debugaddress(colors.yellow('<id_assigned_to_address>', address))
  return new Promise(function(Success, Reject) {
    client.get('address-' + address, function(err, reply) {
      debugaddress(colors.cyan('<id_assigned_to_address>:reply', reply))
      if (reply === null) {
        debugaddress('Rejecting!')
        Reject();
      } else {
        debugaddress('success!', reply)
        Success(reply)
      }
    });
  })
}

var is_address_available = function(address, id) {
  debugaddress(colors.yellow('<is_address_available>', address))
  return new Promise(function(Success, Reject) {
    client.get('address-' + address, function(err, reply) {
      debugaddress(colors.cyan('<is_address_available>', address, reply))
      if (reply == undefined) {
        set_address_in_use(address, id).then(function() {
          Success(address)
        })
      } else {
        Reject(address);
      }
    });
  })
}

module.exports = gateway = function(xpub, exchange_key) {
  this.xpub = xpub
  this.unused_addresses = []
  this.addresses_count = 0
  this.events = new EventEmitter()


  this.retrieved = new HDPublicKey(this.xpub)
  var self = this
  var bitcoin = new BLT()
  this.nullfunction = function(amount) {
    return null;
  }
  this.USDtoBTC = this.nullfunction
  this.BTCtoUSD = this.nullfunction
  this.BTCto = this.nullfunction
  self.update_rates = function() {
    self.exchange.latest(function handleCurrencies(err, data) {
      self.fx.base = "USD";
      self.fx.rates = data.rates
      self.USDtoBIT = function(amount) {
        return self.fx.convert(amount, { from: 'USD', to: 'BTC' }) * 1000000;
      }
      self.BITtoUSD = function(amount) {
        return self.fx.convert(amount / 1000000, { from: 'BTC', to: 'USD' });
      }
      self.mBTCtoUSD = function(amount) {
        return self.fx.convert(amount / 100000000, { from: 'BTC', to: 'USD' });
      }
      self.BITto = function(to, amount) {
        return self.fx.convert(amount / 100000000, { from: 'BTC', to: to });
      }
      self.USDto = function(to, amount) {
        return self.fx.convert(amount, { from: 'USD', to: to });
      }
      self.events.emit('exchange-initialized')
    })
  }

  if (exchange_key != undefined) {
    self.fx = require('money')
    self.exchange = new RatesApi({
      appId: exchange_key
    });
    self.update_rates()
    setInterval(self.update_rates, 1000 * 60 * 30)
  } else {
    self.events.emit('exchange-initialized')
  }

  this.addUSD = function(payment) {
    debugbrp(colors.red.underline('payment-before'), payment)
    payment.usd_amount = self.mBTCtoUSD(payment.amount)
    debugbrp(colors.green.underline('payment-after'), payment)
    return payment
  }

  this.received_payment = function(payment) {
    self.forgetAddress(payment.address)
    id_assigned_to_address(payment.address).then(function(id) {
      payment.id = id
      debugaddress('<got_id_for_that_address>', payment)
      self.events.emit('payment', self.addUSD(payment))
      self.forgetAddress(payment.address)
    }, function() {
      debugaddress('<no_id_for_that_address>', payment)
      self.events.emit('payment', self.addUSD(payment))
    })
  }

  this.forgetAddress = function(address) {
    // debugaddress('ADDRESS USED:', address.toString())
    client.lrem('available-addresses', 0, address.toString());
    client.sadd('used-addresses', address.toString());
    client.get('address-' + address, function(err, reply) {
      debugaddress(colors.cyan('REDIS: address-' + address + ' reply:', reply))
      if (reply != null) {
        debugaddress(colors.red('REDIS: deleting id-' + reply))
        client.del('id-' + reply)
      }
    });
    self.checkAddress(self.i)
    self.i = self.i + 1
  }

  this.checkAddress = function(i) {
    var derived = this.retrieved.derive(0).derive(i);
    var address = new Address(derived.publicKey, Networks.livenet);

    client.lrem('available-addresses', 0, address.toString());
    client.rpush('available-addresses', address.toString());
    // debugaddress('<checkAddress>', i, address)

    client.sismember('used-addresses', address.toString(), function(err, res) {
      if (res != 0) {
        debugaddress(colors.black.bgRed('redis used address', address.toString()))

        self.forgetAddress(address.toString())
      } else {
        bitcoin.getAddress(address).then(function(transaction) {
          //   debugaddress(colors.green('transaction for address', address), transaction)
          if (transaction.txs.length > 0) {
            debugaddress(colors.black.bgRed('blockchain used address', address.toString()))
            client.get('address-' + address.toString(), function(err, reply) {
              if (reply != null) {
                self.received_payment({ address: address.toString(), amount: transaction.total_received })
              } else {
                self.forgetAddress(address.toString())
              }
            })
          } else {
            debugbrp('Monitoring address:', address.toString())
            self.addresses_count = self.addresses_count + 1
            bitcoin.events.on(address.toString(), self.received_payment)
            if (self.addresses_count = max_gap && self.initialized != true) {
              self.initialized = true
              self.events.emit('initialized')
            }
          }
        })
      }
    })
  }


  this.lastrandom = 0
  this.newrandom = 0
  this.i = 0
  this.check_gap = function() {
    debugaddress('<check_gap>')
    var a = 0
    for (; a < max_gap; a++) {
      this.checkAddress(a)
    }
    self.i = a;
  }

  this.creatingAddress = false

  this.getOneAvailable = function(id, addresses, a, Success, Reject) {
    debugaddress('<getOneAvailable>', id)
    is_address_available(addresses[a], id).then(function(address) {
      Success(address)
    }, function() {
      debugaddress('a:', a, 'max_gap', max_gap)
      if (a < (max_gap - 1)) {
        debugaddress('getOneAvailable')
        self.getOneAvailable(id, addresses, a + 1, Success, Reject)
      } else {
        debugaddress('Reject')
        Reject()
      }
    })
  }

  this.createAddress = function(id) {
    debugaddress(colors.magenta('<createAddress>', id))
    return new Promise(function(Succ, Reject) {
      var Success = function(address) {
        self.creatingAddress = false
        seconds_left_for_address(address).then(function(seconds_left) {
          Succ({ address: address, seconds_left: (parseInt(seconds_left) - parseInt(+new Date) / 1000) })
        })
      }
      id_has_address_assigned(id).then(Success, function() {
        client.lrange('available-addresses', 0, -1, function(err, addresses) {
          if (self.creatingAddress != true) {
            self.creatingAddress = true
            self.getOneAvailable(id, addresses, 0, Success, Reject)
          } else {
            self.newrandom = 100 + 500 * Math.random()
            while (self.lastrandom == self.newrandom) {
              self.newrandom = 100 + 1000 * Math.random()
            }
            setTimeout(function() {
              self.getOneAvailable(id, addresses, 0, Success, Reject)
            }, self.newrandom)
            self.lastrandom = self.newrandom
          }
        })
      })
    })
  }

  self.connect = function(){
  bitcoin.events.on('connected', function() {
    self.check_gap()
  })
  bitcoin.connect()
  }


  return this
}