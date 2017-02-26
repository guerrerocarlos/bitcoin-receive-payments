bitcoin-receive-payments
===================
Allow your service to receive/accept bitcoin payments **directly from the bitcoin P2P network**.

Payment notifications are received **live**, directly from the bitcoin network in less than 4 seconds.

An unique bitcoin address is used for each payment, and all funds go to the same wallet, using a [Deterministic Wallet](https://en.bitcoin.it/wiki/Deterministic_wallet) public key. 

Motivation
--
This module eliminates the need of a [payment API](https://blockchain.info/es/api/api_receive) like the one provided by [blockchain.info](https://blockchain.info/) making bitcoin payments even more private and secure.

Bitcoin is designed to remove intermediaries, this module intends exactly that.

Security
--

No private key is stored in the server, so that **funds cannot be stolen in case of the server being hacked**.

Backend
--
This module uses [bitcoin-live-transactions](https://www.npmjs.com/package/bitcoin-live-transactions) to connect in real time to the **Bitcoin P2P network**, using [insight](https://github.com/bitpay/insight-api) public instances that are running online ([socket.io](https://www.npmjs.com/package/socket.io)).

Install
--------------------

> npm install bitcoin-receive-payments --save

Initialization
---

```javascript
const pub_key = 'xpub6CV... extended public key (xPub)'
const openexchangerates_key = 'd1c95b7b... key from openexchangerates.org' // to automatically convert USD amounts to BTC at real time rates
```

Initialize the payment gateway inside in your nodejs app:
```javascript
const BitcoinGateway = require('bitcoin-receive-payments')
const gateway = new BitcoinGateway(pub_key, openexchangerates_key)
```


Obtaining an Extended Public Key (xPub) 
----
xPubs can be created any bitcoin wallet that supports [BIT32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) you can also [create one online](http://bip32.org/) but I wouldn't recommend it.

I do recommend visiting [http://bip32.org/](http://bip32.org/) to better understand how Deterministic Wallets work.

For example, the **bitpay** wallet (desktop version) automatically creates one for you, to get it go to: 
> **Settings -> Personal Wallet -> More Options -> Wallet Information -> Copayer 0**

On **Copay** (iOS) wallet:
> **Settings -> Advanced -> Wallet Information -> Copayer 0**

This public key (xPub) will not allow the gateway to use any funds in your wallet, but will allow the gateway to create as many child public addresses as needed, to receive all the payments from your customers.

Accept payments
--

Every time you want to allow the user to make you a Bitcoin payment, all you need is an unique_ID for that user in your database, and use that unique_ID to create an ***bitcoin address*** for him to pay at, for example:

```javascript
var unique_ID = 5554555 // get this from your database

gateway.createAddress(unique_ID)
.then(function(address) {

    console.log('got new address', address.address, 'and it has', address.seconds_left / 60, 'minutes left before it expires.')
    
    var amount = 3.99
    
    console.log('ask user to pay ', amount, 'USD in it as', gateway.USDtoBIT(amount) + ' bits, using HTML, preferably as a QR code')
    
}).catch(function() {
    console.log('limit reached! cant get a new address :(')
})
```
Would output:
```
created new address 1K2xWPtGsvg5Sa2X7URZ5VfU8xS62McbXz and it has 14 minutes left before it expires.
ask user to pay 3.99 USD (3763.63610805 bits) using HTML, preferably as a QR code
```

Process payments
--

With that address (**1K2xWPtGsvg5Sa2X7URZ5VfU8xS62McbXz**) you can now ask the user to make the payment, using a QR code, and a ***fancy user interface***.

On your service backend, any payment done to that address sent to your wallet will trigger a **payment** event that must be handled as follows:
```javascript
gateway.events.on('payment', function(payment) {
  console.log('got a payment!.', payment)
})
```
So that if someone makes a payment to that address, you will receive a notification it in matter of seconds:
```
got a payment!. 
{ address: '1K2xWPtGsvg5Sa2X7URZ5VfU8xS62McbXz',
  amount: 380600,
  id: '5554555',
  usd_amount: 4.034911868211425 }
````

With this information you can perfectly know that the user with the unique_id **5554555** is the one who made the payment of the **$3.99** (usd_amount field) and process it accordingly (some cents difference will always happen depending on exchange rate of the moment). Preferably updating the user interface on the fly, using some real-time communitacion like [socket.io](https://socket.io/).

**Note:**

The ***payment*** events will also be triggered at **gateway.connect()** if there are payments that happened when the server was reloading/restarting or just turned off. So make sure to handle the ***payment*** event, before starting the gateway with:

```javascript
gateway.connect()
```

The **initialized** event means that the gateway is ready and monitoring the bitcoin network so to detect any payment made to any of the newly created addresses generated by the gateway. 

```javascript
gateway.events.on('initialized', function() {
  console.log('gateway has been intialized.')
  // start creating addresses after the initialized event
  // gateway.createAddress(unique_id)...
});
```

Address expiration timer
--

All newly created addresses have a 15 minutes countdown, it is a consequence of a limitation imposed by [BIP0044](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki).

**It is important to show the user the time it has left to pay to a given bitcoin address, and to handle it's expiration (address renewal) appropriately, preferably showing a live timer/countdown**

Timer needed because of BIP44
--

[BIP0044](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) defines that when recovering a [Deterministic Wallet](https://en.bitcoin.it/wiki/Deterministic_wallet), all child addresses are re-created to recover all the funds, if 20 consecutive child addresses are checked and no funds are found, it finishes recovering and no more are checked, assuming there is no more funds in any more child-addresses.

In other words, regardless that a **Extended Public Key (xPub)** can create any number of public addresses to receive funds at the same time, if there is a gap of more than 20 addresses between an address that received funds and the next one, the wallet recovery algorithm will not be able to recover all the funds when recovering that wallet, transfering the keys to another platform, etc.

So this is solved assigning addresses an expiration date in minutes and re-using them if no payment have been received in them after that period of time, limiting the number of unused addresses created simultaneously.

The number of minutes before expiration can be modified towards improving user experience.

Batteries included
--

This module automatically takes care of all the timing and proper address reuse to comply with [BIP0044](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki). All payments made to addresses created using this module, will reach your wallet without problem.

Contributing
--

Donations to the same address used in the examples are highly appreciated:

![**1K2xWPtGsvg5Sa2X7URZ5VfU8xS62McbXz**](https://raw.githubusercontent.com/guerrerocarlos/carlosguerrero.com/master/donation_qr_guerrerocarlos.png)

**1K2xWPtGsvg5Sa2X7URZ5VfU8xS62McbXz**

Also **code** is welcome, Unit Tests are still pending.

Any problem please report it directly in [github](https://github.com/guerrerocarlos/bitcoin-receive-payments/issues)