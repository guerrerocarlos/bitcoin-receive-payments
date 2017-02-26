# bitcoin-inventory

[![npm version](https://img.shields.io/npm/v/bitcoin-inventory.svg)](https://www.npmjs.com/package/bitcoin-inventory)
[![Build Status](https://travis-ci.org/mappum/bitcoin-inventory.svg?branch=master)](https://travis-ci.org/mappum/bitcoin-inventory)
[![Dependency Status](https://david-dm.org/mappum/bitcoin-inventory.svg)](https://david-dm.org/mappum/bitcoin-inventory)

**Exchange transactions with peers**

## Usage

`npm install bitcoin-inventory`

```js
var Inventory = require('bitcoin-inventory')

// "peers" is a PeerGroup or Peer from the `bitcoin-net` package
var inv = Inventory(peers)

// get a tx that was sent to us
inv.get(hash) // returns tx

// add a tx and announce its hash to our peers
inv.broadcast(tx)

inv.on('tx', (tx) => { /* got tx */ })
inv.on('tx:<txid>', (tx) => { /* got tx with hex hash `txid` */ })
```

`Inventory` handles the exchange of Bitcoin transactions with peers.

When a peer discovers a new transaction, they send us a message (`inv`) announcing its hash. If we have not yet seen this transaction, `Inventory` will request it from the peer and add it to the inventory.

If we create a new transaction, `Inventory` will announce the hash to our peers, and send the transaction data to them if they request it.

----
#### `new Inventory(peers, [opts])`

Creates an `Inventory` which listens for and fetches new transactions from peers, and announces transactions to peers.

Transactions are only kept in the `Inventory` for a limited amount of time, after which they are automatically pruned. (The amount of time is configurable via the `ttl` option).

`peers` should be an instance of `PeerGroup` or `Peer`, from the [`bitcoin-net`](https://github.com/mappum/bitcoin-net) package.

`opts` may be an object containing:
- `ttl` *Number* (default: `120000` (2 minutes)) - the amount of time to keep transactions in the inventory before pruning them (in ms)

----
#### `inv.get(hash)`

Returns the transaction from the inventory with the specified hash (which is a `Buffer`).

----
#### `inv.broadcast(tx)`

Adds `tx` to the inventory, and announces its hash to the peers. Also listens for peers to request the full transaction from us.

----
#### `inv.close()`

Closes the inventory and clears timers.
