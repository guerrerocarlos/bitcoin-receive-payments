var util = require('util')
var EventEmitter = require('events').EventEmitter;
var BLT = require("bitcoin-live-transactions")
var bitcore = require('bitcore-lib');
var HDPublicKey = bitcore.HDPublicKey;
var Address = bitcore.Address;
var Networks = bitcore.Networks;
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
var randomstring = require('randomstring')

// var env = process.env.NODE_ENV || 'development';
// var config = require('./config')[env];
// require('./config/mongoose')(config);
// client.flushdb()

module.exports = Gateway

var set_address_in_use = function(address, id, rawid) {
  debugaddress(colors.yellow('<set_address_in_use>', address, id))
  return new Promise(function(Success, R) {
    client.set('address-' + address, id, function(err, reply) {
      //   debugaddress(err, reply)
      client.expireat('address-' + address, parseInt((+new Date) / 1000) + seconds_in_cache_15); // delete after 15 minutes
    });
    client.set('rawid-address-' + address, rawid, function(err, reply) {
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
    client.get('rawid-address-' + address, function(err, reply) {
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

var is_address_available = function(address, id, rawid) {
  debugaddress(colors.yellow('<is_address_available>', address))
  return new Promise(function(Success, Reject) {
    client.get('address-' + address, function(err, reply) {
      debugaddress(colors.cyan('<is_address_available>', address, reply))
      if (reply == undefined) {
        set_address_in_use(address, id, rawid).then(function() {
          Success(address)
        })
      } else {
        Reject(address);
      }
    });
  })
}


var generate_key = function() {
  return randomstring.generate({
    length: 14,
    charset: 'abcdefghijklmnpqrstuvwxyz1234567890'
  });
}

function Gateway(xpub, exchange_key) {
  var self = this
  this.ies = {}
  if (!(self instanceof Gateway)) return new Gateway(xpub, exchange_key)
    // this.xpub = xpub
  this.unused_addresses = []
  this.addresses_count = 0
  this.events = new EventEmitter()

  // this.retrieved = new HDPublicKey(this.xpub)
  var bitcoin = new BLT()

  self.update_rates = function() {

    console.log('<update_rates>')
    self.exchange.latest(function handleCurrencies(err, data) {
      console.log('got latest rates...')
      self.fx.base = "USD";
      self.fx.rates = data.rates
      self.fx.currencies = Object.keys(data.rates)
      self.getCurrencies = function() {
        return self.fx.currencies
      }
      self.validCur = function(Cur) {
        if (Object.keys(self.fx.rates).indexOf(Cur.toUpperCase()) > -1) {
          return true
        } else {
          return false
        }
      }
      self.USDtoBIT = function(amount) {
        return self.fx.convert(amount, { from: 'USD', to: 'BTC' }) * 1000000;
      }
      self.BITtoUSD = function(amount) {
        return self.fx.convert(amount / 1000000, { from: 'BTC', to: 'USD' });
      }
      self.uBTCtoUSD = self.BITtoUSD
      self.SATtoUSD = function(amount) {
        return self.fx.convert(amount / 100000000, { from: 'BTC', to: 'USD' });
      }
      self.mBTCtoUSD = function(amount) {
        return self.fx.convert(amount / 100000000, { from: 'BTC', to: 'USD' });
      }
      self.uBTCtoSAT = function(amount) {
        return amount * 100
      }
      self.SATtouBTC = function(amount) {
        return amount / 100
      }
      self.convert = function(from, to, amount) {
        return self.fx.convert(amount, { from: from, to: to });
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
    payment.amount_usd = self.SATtoUSD(payment.amount)
    debugbrp(colors.green.underline('payment-after'), payment)
    return payment
  }

  this.received_payment = function(payment, xpubinfo, initializedCallback) {
    debugbrp(colors.green('<received_payment>'), payment)
      // self.forgetAddress(payment.address, xpubinfo, initializedCallback)
    id_assigned_to_address(payment.address).then(function(id) {
      payment.id = id
      debugaddress('<got_id_for_that_address>', payment)
      self.events.emit('payment', payment)
      self.events.emit(payment.address, payment)
      self.forgetAddress(payment.address, xpubinfo, initializedCallback)
    }, function() {
      debugaddress('<no_id_for_that_address>', payment)
      self.events.emit('payment', payment)
      self.events.emit(payment.address, payment)
      self.forgetAddress(payment.address, xpubinfo, initializedCallback)
    })
  }

  this.forgetAddress = function(address, xpubinfo, initializedCallback) {
    // debugaddress('ADDRESS USED:', address.toString())
    client.lrem('available-addresses' + xpubinfo._id, 0, address.toString());
    client.sadd('used-addresses' + xpubinfo._id, address.toString());
    client.get('address-' + address, function(err, reply) {
      debugaddress(colors.cyan('forgetAddress REDIS: address-' + address + ' reply:', reply))
      if (reply != null) {
        debugaddress(colors.red('REDIS: deleting id-' + reply))
        client.del('id-' + reply)
      }
    });
    self.checkAddress(xpubinfo, self.ies[xpubinfo._id], initializedCallback)
    self.ies[xpubinfo._id] = self.ies[xpubinfo._id] + 1
  }
  var initialized = {}
  var address_count = {}
  this.checkAddress = function(xpubinfo, i, initializedCallback) {
    // console.log('xpubinfo', xpubinfo)
    var retrieved = new HDPublicKey(xpubinfo.xpub)
    var derived = retrieved.derive(0).derive(i);
    var address = new Address(derived.publicKey, Networks.livenet);

    client.lrem('available-addresses' + xpubinfo._id, 0, address.toString());
    client.rpush('available-addresses' + xpubinfo._id, address.toString());
    // debugaddress('<checkAddress>', i, address)

    client.sismember('used-addresses' + xpubinfo._id, address.toString(), function(err, res) {
      if (res != 0) {
        debugaddress(colors.black.bgRed('redis used address', address.toString()))

        self.forgetAddress(address.toString(), xpubinfo, initializedCallback)
      } else {
        bitcoin.getBalance(address.toString()).then(function(transaction) {
          //   debugaddress(colors.green('transaction for address', address), transaction)
          if (transaction.txs > 0) {
            debugaddress(colors.black.bgRed('blockchain used address', address.toString()), 'transaction', transaction)
            client.get('address-' + address.toString(), function(err, reply) {
              if (reply != null) {
                self.received_payment({ address: address.toString(), amount: self.uBTCtoSAT(transaction.in) }, xpubinfo, initializedCallback)
              } else {
                self.forgetAddress(address.toString(), xpubinfo, initializedCallback)
              }
            })
          } else {
            debugbrp('Monitoring address:', address.toString())
            if (address_count[xpubinfo._id] == undefined) {
              address_count[xpubinfo._id] = 0
            }
            address_count[xpubinfo._id] = address_count[xpubinfo._id] + 1
            console.log('address_count', address_count)
            bitcoin.events.on(address.toString(), function(payment) {
              self.received_payment(payment, xpubinfo, initializedCallback)
            })
            if (address_count[xpubinfo._id] > 4 && initialized[xpubinfo._id] != true) {
              initialized[xpubinfo._id] = true
              initializedCallback()
                // self.events.emit('initialized')
            }
          }
        })
      }
    })
  }


  this.lastrandom = 0
  this.newrandom = 0

  this.check_gap = function(xpubinfo, callback) {
    debugaddress('<check_gap>', xpubinfo)
    if (this.ies[xpubinfo._id] == undefined) {
      this.ies[xpubinfo._id] = 0
    }
    var a = this.ies[xpubinfo._id]
    if (a < max_gap) {
      for (var a = 0; a < max_gap; a++) {
        this.checkAddress(xpubinfo, a, callback)
      }
      // xpubinfo.i = a;
      this.ies[xpubinfo._id] = a
    } else {
      callback()
    }
  }

  this.creatingAddress = false

  self.getOneAvailable = function(id, rawid, addresses, a, Success, Reject) {
    debugaddress('<getOneAvailable>', id)
    is_address_available(addresses[a], id, rawid).then(function(address) {
      Success(address)
    }, function() {
      debugaddress('a:', a, 'max_gap', max_gap)
      if (a < (max_gap - 1)) {
        debugaddress('getOneAvailable')
        self.getOneAvailable(id, rawid, addresses, a + 1, Success, Reject)
      } else {
        debugaddress('Reject')
        Reject()
      }
    })
  }

  var creatingAddresses = {}
  self.createAddress = function(xpub, id) {
    console.log('<createAddress>', xpub, id)
    return new Promise(function(Succ, Reject) {
      client.get(xpub, function(err, xpubid) {
        if (xpubid == null) {
          xpubid = generate_key()
          client.set(xpub, xpubid, function(err, reply) {
            console.log('set new key', xpubid, 'for xpub:', xpub)
          })
        }
        console.log('got key', xpubid)

        var Success = function(address) {
          creatingAddresses[xpubinfo._id] = false
          seconds_left_for_address(address).then(function(seconds_left) {
            Succ({ address: address, seconds_left: (parseInt(seconds_left) - parseInt(+new Date) / 1000) })
          })
        }

        var process_create_request = function() {
          id_has_address_assigned(id + xpubinfo._id).then(Success, function() {
            debugaddress(colors.green('<Have to get a new one...>'))
            client.lrange('available-addresses' + xpubinfo._id, 0, -1, function(err, addresses) {
              if (creatingAddresses[xpubinfo._id] != true) {
                creatingAddresses[xpubinfo._id] = true
                self.getOneAvailable(id + xpubinfo._id, id, addresses, 0, Success, Reject)
              } else {
                self.newrandom = 100 + 500 * Math.random()
                while (self.lastrandom == self.newrandom) {
                  self.newrandom = 100 + 1000 * Math.random()
                }
                setTimeout(function() {
                  self.getOneAvailable(id + xpubinfo._id, id, addresses, 0, Success, Reject)
                }, self.newrandom)
                self.lastrandom = self.newrandom
              }
            })
          })
        }

        var xpubinfo = { _id: xpubid, xpub: xpub }
        if (self.ies[xpubinfo._id] == undefined) {
          self.check_gap(xpubinfo, process_create_request)
        } else {
          process_create_request()
        }
        debugaddress(colors.magenta('<createAddress>', id))


      })
    })
  }

  self.connect = function() {
    bitcoin.events.on('connected', function() {
      // self.check_gap()
    })
    bitcoin.connect()
  }


  return this
}
