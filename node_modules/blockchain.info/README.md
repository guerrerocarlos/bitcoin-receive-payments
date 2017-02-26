# Blockchain API Library (Node, v1)

An official Node module for interacting with the Blockchain.info API.

## Getting started

Installation via [npm](https://npmjs.com):

```sh
$ npm install --save blockchain.info
```

Importing:

```js
var blockchain = require('blockchain.info')
```

## Responses

All functions in this module return a JavaScript [promise](https://promisesaplus.com/) for handling asynchronous actions.

## Submodules

This module consists of these submodules:

  * [`MyWallet`](./MyWallet) - Interact with or create a Blockchain Wallet
  * [`blockexplorer`](./blockexplorer) - View data for addresses, blocks, transactions, and more
  * [`exchange`](./exchange) - Get real-time bitcoin exchange rates
  * [`pushtx`](./pushtx) - Push custom transactions
  * [`Receive`](./Receive) - Receive notifications for payments
  * [`Socket`](./Socket) - Live notifications for transactions and blocks
  * [`statistics`](./statistics) - Fetch historical blockchain data and statistics

You can access sub-modules from the properties of the imported main module, or by importing them individually.

Individual import:

```js
var MyWallet = require('blockchain.info/MyWallet')
```

Property import:

```js
var MyWallet = require('blockchain.info').MyWallet
```
