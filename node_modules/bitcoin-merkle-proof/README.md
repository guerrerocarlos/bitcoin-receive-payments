# bitcoin-merkle-proof

[![npm version](https://img.shields.io/npm/v/bitcoin-merkle-proof.svg)](https://www.npmjs.com/package/bitcoin-merkle-proof)
[![Build Status](https://travis-ci.org/mappum/bitcoin-merkle-proof.svg?branch=master)](https://travis-ci.org/mappum/bitcoin-merkle-proof)
[![Dependency Status](https://david-dm.org/mappum/bitcoin-merkle-proof.svg)](https://david-dm.org/mappum/bitcoin-merkle-proof)

**Verify Bitcoin Merkle trees**

Bitcoin [BIP37](https://github.com/bitcoin/bips/blob/master/bip-0037.mediawiki) adds support for `merkleblock` messages, which allow clients to download blocks that only include transactions relevant to them. The transactions are selected via a Bloom Filter.

This module verifies the Merkle proofs in a `merkleblock` message, and lists the included transactions which match the filter.

## Usage

`npm install bitcoin-merkle-proof`

```js
var merkleTree = require('bitcoin-merkle-proof')

// build partial merkle tree object (block #681135 in testnet)
var partialMT = merkleTree.build({
  hashes: [
    new Buffer('52a893ef120d5e24aa38604ead9ada6628eea417df6d6096ef0dd7b73a89c0e9', 'hex'),
    new Buffer('a76a1e1bffbbb254bd897e379298549eb8ff4aa57a4bb4c06637b36d76833207', 'hex'),
    new Buffer('056b4e64697677788744a8ad23cc407cbc1c357ff889d9975edd431fb779466f', 'hex'),
    new Buffer('3c51bfb4f9cdd2b8e3a5c47cb1b3bdbc8879a1c1b238d4123dcb572a00b2b80e', 'hex'),
    new Buffer('d6d1f9ca0a4017050379a82ecccb050cf4218f2180087e9592110972a71e375c', 'hex')
  ],
  include: [
    new Buffer('3c51bfb4f9cdd2b8e3a5c47cb1b3bdbc8879a1c1b238d4123dcb572a00b2b80e', 'hex'),
    new Buffer('d6d1f9ca0a4017050379a82ecccb050cf4218f2180087e9592110972a71e375c', 'hex')
  ],
  merkleRoot: new Buffer('b9b4500294c18487dc32a929b587475fbf9652beb7d73010ea37ee0483e52e58', 'hex')
})
// { flags: [ 235, 1 ],
//   hashes:
//    [ <Buffer 19 d6 5e 9e 20 d4 55 db ae 6d 11 39 66 54 7a 1d 41 91 e3 cf eb 3c 4c 2a b9 0e d2 79 5f 39 c4 cc>,
//      <Buffer 05 6b 4e 64 69 76 77 78 87 44 a8 ad 23 cc 40 7c bc 1c 35 7f f8 89 d9 97 5e dd 43 1f b7 79 46 6f>,
//      <Buffer 3c 51 bf b4 f9 cd d2 b8 e3 a5 c4 7c b1 b3 bd bc 88 79 a1 c1 b2 38 d4 12 3d cb 57 2a 00 b2 b8 0e>,
//      <Buffer d6 d1 f9 ca 0a 40 17 05 03 79 a8 2e cc cb 05 0c f4 21 8f 21 80 08 7e 95 92 11 09 72 a7 1e 37 5c> ],
//   numTransactions: 5,
//   merkleRoot: <Buffer b9 b4 50 02 94 c1 84 87 dc 32 a9 29 b5 87 47 5f bf 96 52 be b7 d7 30 10 ea 37 ee 04 83 e5 2e 58> }

// extract included hashes from object
var hashes = merkleTree.extract(partialMT)
console.log('Matched transactions: ', hashes.map(function(b) { return b.toString('hex') }))
```

##### `var partialMerkleTree = merkleTree.build(block)`

Construct proof object for transactions. Proof object:
```js
{
  flags: number[],
  hashes: Buffer[],
  numTransactions: number,
  merkleRoot: Buffer
}
```

##### `var hashes = merkleTree.verify(partialMerkleTree)`

Takes a block from a `merkleblock` message, and verifies the tree. An error will be thrown if the tree does not match the expected Merkle root. Returns an array of txids (as `Buffers`), that matched the Bloom filter.
