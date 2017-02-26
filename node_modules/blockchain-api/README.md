node-blockchain-wallet
======================

An unofficial node.js client for the [blockchain.info wallet api](http://blockchain.info/api/blockchain_wallet_api).

## Installation

```
npm install blockchain-api
```

## Usage

```javascript
var chain = require('blockchain-api').chain,
    blockChain = new chain(); // Basic

let callback = (err, data) => console.log(err, data);

// Basics
blockChain.createWallet({
  password : 'MyPass',
  api_code : API_KEY,
  priv : null,
  label : null,
  email : null
}, callback);
blockChain.chart('typeChart', callback);
blockChain.stats(callback);
blockChain.ticker(callback);
blockChain.toBTC('USD', 100, callback);

// Exec
/* WALLET */
let wallet = blockChain.wallet(GUID, PASS1, PASS2);
let options = {
  from : 'Send from a specific Bitcoin Address (Optional)'
  fee : 'Transaction fee value in satoshi (Must be greater than default fee) (Optional)'
  note : 'A public note to include with the transaction -- can only be attached to transactions where all outputs are greater than 0.005 BTC.(Optional)'
};
wallet.balance(callback);
wallet.list(callback);
wallet.addressBalance(address, confirmations, callback);
wallet.payment(to, amount, [options,] callback);
wallet.sendMany({
  'Adrress1' : 2,
  'Adrress2' : 1,
  ...
}, [options,] callback);
wallet.newAddress(name, callback);
wallet.archiveAddress(address, callback);
wallet.unarchiveAddress(address, callback);
wallet.autoConsolidate(days, callback);

/* QUERY */
let query = blockChain.query();

let params = {}; // Params is no define
query.getDifficulty( params, callback);
query.getBlockCount( params, callback);
query.latesthash( params, callback);
query.bcperBlock( params, callback);
query.totalBc( params, callback);
query.probability( params, callback);
query.hashestowin( params, callback);
query.nextreTarget( params, callback);
query.avgtxSize( params, callback);
query.avgtxValue( params, callback);
query.interval( params, callback);
query.eta( params, callback);
query.avgtxNumber( params, callback);
query.getReceivedByAddress( address, callback);
query.getSentByAddress( address, callback);
query.addressBalance( address, callback);
query.addressFirstseen( address, params, callback);
query.txTotalbtcOutput( hash, params, callback);
query.txTotalbtcInput( hash, params, callback);
query.txFee( hash, params, callback);
query.txResult( hash, address, params, callback);
query.hashtontxid( hash, params, callback);
query.ntxidtohash( hash, params, callback);
query.addressToHash( address, params, callback);
query.hashToAddress =(hash, params, callback);
query.hashPubKey( hash, params, callback);
query.addrPubKey( hash, params, callback);
query.pubKeyAddr( hash, params, callback);
query.newKey( params, callback);
query.unconfirmedCount( params, callback);
query.price24hr( params, callback);
query.marketCap( params, callback);
query.transactionCount24hr( params, callback);
query.btcsent24hr( params, callback);
query.hashRate( params, callback);

/* API */
let api = blockChain.api();

let address = 'address' || [ 'address1', 'address2' ];
api.address(address, callback);
api.unspent(address, callback);

api.rawblock($block_index || $block_hash, callback);
api.rawTx($tx_index || $tx_hash, callback);
api.blockHeight($block_height, callback);
api.latestblock(callback);
api.unconfirmedTransactions(callback);
api.blocks($time_in_milliseconds || $pool_name, callback);
api.inv($hash, callback);

/* Receive Payments */
let receivePayments = blockChain.receivePayments(API_KEY);

receivePayments.receive(xpub, callUrl, callback);
receivePayments.callbackLog(callUrl, callback);
```

## Reference

A method-by-method [reference](https://github.com/pskupinski/node-blockchain-wallet/wiki/API-Reference) is available on the wiki.

