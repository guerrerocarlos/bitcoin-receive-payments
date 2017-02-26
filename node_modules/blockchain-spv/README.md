# blockchain-spv

[![npm version](https://img.shields.io/npm/v/blockchain-spv.svg)](https://www.npmjs.com/package/blockchain-spv)
[![Build Status](https://travis-ci.org/mappum/blockchain-spv.svg?branch=master)](https://travis-ci.org/mappum/blockchain-spv)
[![Dependency Status](https://david-dm.org/mappum/blockchain-spv.svg)](https://david-dm.org/mappum/blockchain-spv)

**Stores blockchain headers and verifies transactions with SPV**

## Usage

`npm install blockchain-spv`

```js
// import blockchain parameters for Bitcoin
var params = require('webcoin-bitcoin').blockchain

// create a LevelUp database where the block data should be stored
var db = levelup('bitcoin.chain', { db: require('memdown') })

// create blockchain
var Blockchain = require('blockchain-spv')
var chain = new Blockchain(params, db)

// wait for the blockchain to be ready
chain.on('ready', function () {
  // use the blockchain
}
```

`Blockchain` stores and verifies block headers, and does SPV (lite client) verification. It is compatible with Bitcoin and Bitcoin-derived blockchains.

----
#### `new Blockchain(params, db)`

Creates an SPV `Blockchain` which stores and verifies block headers.

`params` should be the blockchain parameters for the blockchain you wish to use. Parameters for Bitcoin are available at `require('webcoin-bitcoin').blockchain`. For more info about params you can use, see the [Parameters](#parameters) section.

`db` should be a [`LevelUp`](https://github.com/Level/levelup) instance where block data will be stored. The db should not be shared with another Blockchain (if you need to, use [`level-sublevel`](https://github.com/dominictarr/level-sublevel) to create a sub-section of your db).

Make sure to wait for the `ready` event before using the blockchain.

----
#### `chain.addHeaders(headers, callback)`

Adds block headers to the chain. `headers` should be an array of contiguous, ascending block headers. The headers will be verified (checked to make sure the expected amount of work was done, the difficulty was correct, etc.). The callback will be called with `cb(err, header)` where `header` is an invalid header if there was a validation error.

----
#### `chain.createWriteStream()`

Returns a writable stream that takes in arrays of block headers and adds them to the chain. This is essentially just a stream wrapper for `chain.addHeaders()`, making it easier to get headers from a `HeaderStream` (from the [`bitcoin-net`](https://github.com/mappum/bitcoin-net) module).

----
#### `chain.createReadStream([opts])`

Returns a readable stream that outputs blocks from the blockchain (in order). The stream will stay open even when it reaches the chain tip, and will output new blocks as they are received (this means you don't have to think about whether the chain is done syncing or not).

If a reorg happens (blocks that have been emitted are now on an invalid fork), the stream will emit the now-invalid blocks again in descending order (so that each can be un-processed). Each block has a boolean `add` property which is `false` if it is being removed from the chain. **NOTE:** It is important to always check the value of `block.add` and un-process blocks when they are invalidated.

`opts` may contain the following options:
- `from` *Buffer* (default: `null`) - start the stream at the block with this hash (exclusive). If `from` is `null`, the stream will start at the genesis block.

----
#### `chain.getBlock(hash, callback)`

Gets a block in the chain with hash `hash`. `hash` must be a Buffer. The callback is called with `cb(err, block)`.

----
#### `chain.getBlockAtHeight(height, callback)`

Gets a block in the chain with height `height`. The callback is called with `cb(err, block)`.

Note that this requires the blockchain to be traversed (from the tip or genesis block, whichever is closest), so it runs in `O(N/2)` time.

----
#### `chain.getBlockAtTime(timestamp, callback)`

Gets the highest block with a timestamp that comes before or on `timestamp`. `timestamp` should be in [Unix time](https://en.wikipedia.org/wiki/Unix_time) measured in seconds (not milliseconds as returned by `Date.now()`). The callback is called with `cb(err, block)`.

Note that this requires the blockchain to be traversed (from the tip or genesis block, whichever is closest), so it runs in `O(N)` time.

----
#### `chain.getTip()`

Returns the highest block added to the chain.

----
#### `chain.getPath(from, to, callback)`

Gets the path of blocks between `from` and `to`. This is useful to know which blocks to process or unprocess when getting from one part of a chain to another (including going across forks). Calls the callback with `cb(err, path)` where `path` is the following:
```js
{
  add: Array,
  // an array of Blocks which should be processed

  remove: Array,
  // an array of Blocks which should be unprocessed

  fork: Block
  // the first block of the fork (if any)
}
```

**Examples:**
```
[a]<-[b]<-[c]<-[d]

'getPath(a, d)' results in:
{
  add: [ b, c, d ],
  remove: [],
  fork: undefined
}

'getPath(d, a)' results in:
{
  add: [],
  remove: [ d, c, b ],
  fork: undefined
}
```

```
[a]<-[b]<-[c]<-[d]
  \
  [e]<-[f]

'getPath(f, d)' results in:
{
  remove: [ f, e ],
  add: [ b, c, d ],
  fork: e
}
```

----
#### `chain.getPathToTip(from, callback)`

A convenience method for `chain.getPath(from, chain.getTip(), cb)`.

----
### Parameters

Parameters specify blockchain rules and constants for different cryptocurrencies and blockchains. Parameters should contain the following:
```js
{
  // REQUIRED

  // the data used in the header of the genesis block for this blockchain
  genesisHeader: {
    version: Number,
    prevHash: Buffer,
    merkleRoot: Buffer,
    timestamp: Number,
    bits: Number,
    nonce: Number
  },

  // called to check if we should recalculate the difficulty this block
  // should call the callback with `cb(err, retarget)`
  // where `retarget` is a boolean
  shouldRetarget: function (block, callback) { ... },

  // called to calculate the expected difficulty for `block`
  // should call the callback with `cb(err, target)`,
  // where `target` is a Buffer containing the target hash
  calculateTarget: function (block, blockchain, callback) { ... },

  // called to compute the hash of the header used to verify mining
  // should call the callback with `cb(err, hash)`,
  // where `hash` is a Buffer
  miningHash: function (header, callback) { ... },

  // OPTIONAL

  // an array of blocks to use to speed up initial blockchain sync,
  // or as an extra source of data for verifying headers received from peers.
  // any number of blocks can be provided, and they should be sorted ascending by height
  checkpoints: [
    {
      height: Number,
      header: {
        version: Number,
        prevHash: Buffer,
        merkleRoot: Buffer,
        timestamp: Number,
        bits: Number,
        nonce: Number
      }
    }
  ]
}
```

For some examples, see these parameter repos:
- [`webcoin-bitcoin`](https://github.com/mappum/webcoin-bitcoin/blob/master/src/blockchain.js)
- [`webcoin-bitcoin-testnet`](https://github.com/mappum/webcoin-bitcoin-testnet/blob/master/src/blockchain.js)
- [`webcoin-zcash-alpha`](https://github.com/mappum/webcoin-zcash-alpha/blob/master/src/blockchain.js)
