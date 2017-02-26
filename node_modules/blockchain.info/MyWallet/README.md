
# Blockchain MyWallet Module

Programmatically interact with your Blockchain.info wallet. [View full API documentation](https://blockchain.info/api/blockchain_wallet_api).

## Opening a wallet

Importing:

```js
var MyWallet = require('blockchain.info/MyWallet')
```

An instance of a wallet needs to be initialized before it can be used:

```js
var wallet = new MyWallet(identifier, password, options)
```

Options:

  * `secondPassword` - second wallet password (required only if wallet is double-encrypted)
  * `apiCode` - Blockchain.info api code (will be automatically included in all further requests to the wallet)
  * `apiHost` - set the host for the api calls (required)

## Wallet API v2 Compatibility

This module requires the [Wallet API v2 service](https://github.com/blockchain/service-my-wallet-v3). To use the wallet service for api calls, set the `apiHost` option to point to where the service is running.

Example:

```js
var options = { apiCode: 'myAPICode', apiHost: 'http://localhost:3000' }
var wallet = new MyWallet('myIdentifier', 'myPassword123', options)
wallet.getBalance().then(function (balance) { console.log('My balance is %d!', balance); })
```

## Response objects

Payment Response Object Properties:

  * `message` - message confirming the transaction (*string*)
  * `tx_hash` - the hash of the transaction (*string*)
  * `notice` - notice, not always returned (*string*)

Address Object Properties:

  * `address` - the address name (*string*)
  * `balance` - the address balance in satoshi (*number*)
  * `label` - the address label (*string* or *null*)
  * `total_received` - the total satoshi ever received by the address (*number*)

## Class Methods

### create

Usage:

```js
MyWallet.create(password, apiCode, options)
```

Create a new Blockchain Wallet. Responds with an instance of MyWallet, which will adopt the same api code used to create the wallet. If you are using the Wallet API v2 service, remember to set the `apiHost` option to wherever the service is running.

Parameters:

  * `password` - password to set for the wallet (required, must be greater than 10 characters)
  * `apiCode` - Blockchain.info api code (required)

Options:

  * `priv` - private key to use for the wallet's first bitcoin address
  * `label` - label to give to the wallet's first bitcoin address
  * `email` - email to associate with the new Blockchain Wallet
  * `apiHost` - set the host for the api calls to the newly created wallet (required)

## Instance Methods

The API code passed into the MyWallet constructor is automatically included in all requests to the wallet.

### Send Bitcoin

Usage:

```js
wallet.send(address, amount, options)
```

Sends bitcoin from the wallet to a given address. Responds with a Payment Response Object.

Parameters:

  * `address` - bitcoin address to send to
  * `amount` - amount **in satoshi** to send

Options (optional):

  * `from` - send from a specific Bitcoin address (*string*)
  * `fee` - transaction fee value **in satoshi** (*number*, defaults to 0.0001btc)
  * `note` - public note to include with transaction (*string*, transaction must be > 0.005btc)

### Send to multiple addresses

Usage:

```js
wallet.sendMany(recipients, options)
```

Sends bitcoin to multiple addresses. Responds with a Payment Response Object.

Parameters:

  * `recipients` - *object* with properties/values in the format: "receivingAddress":amount (required)

Options (optional):

  * `from` - send from a specific Bitcoin address (*string*)
  * `fee` - transaction fee value **in satoshi** (*number*, defaults to 0.0001btc)
  * `note` - public note to include with transaction (*string*, transactions must be > 0.005btc)

### Get wallet balance

Usage:

```js
wallet.getBalance()
```

Responds with the entire balance of a wallet, as a number, **in satoshi**.

### List wallet addresses

Usage:

```js
wallet.listAddresses()
```

Responds with an *object* that has an **addresses** property. This property is an **array** of Address Objects.

### Get address

Usage:

```
wallet.getAddress(address, options)
```

Responds with an address object of the specified address.

Parameters:

  * `address` - the name of the address (*string*)

Options (optional):

  * `confirmations` - minimum number of confirmations to check for (*number*, defaults to 6)

### Create new address

Usage:

```js
wallet.newAddress(options)
```

Creates a new address. Responds with a partial Address Object (contains just the **address** property, also contains the **label** property if a label parameter was passed).

Options (optional):

  * `label` - automatically set the label of the new address (*string*)

### Archive address

Usage:

```js
wallet.archiveAddress(address)
```

Archives a specific address. Responds with an object that has the property **archived**, which is set to the name of the archived address (*string*).

Parameters:

  * `address` - the name of the address to archive (*string*)

### Unarchive address

Usage:

```js
wallet.unarchiveAddress(address)
```

Unarchives a specific address. Responds with an object that has the property **active**, which is set to the name of the unarchived address (*string*).

Parameters:

  * `address` - the name of the address to unarchive (*string*)

### Consolidating addresses

Usage:

```js
wallet.consolidate(options)
```

Consolidates addresses that have not received transactions recently into a single new address, which is automatically added to the wallet. Responds with an object that has the property **consolidated**, which is set to an array of the names of all addresses that were consolidated (*string*).

Options (optional):

  * `days` - addresses which have not received any transactions in at least this many days will be consolidated (*number*, defaults to 60)
