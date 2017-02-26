
# Blockchain.info Socket Module

Blockchain data delivered in real-time. [View full API documentation](https://blockchain.info/api/api_websocket).

## Importing

```js
var Socket = require('blockchain.info/Socket')
```

## Instantiating

An instance of `Socket` must be instantiated before using it:

```js
var mySocket = new Socket()
```

## Methods

### close

```js
mySocket.close()
```

### onOpen

```js
mySocket.onOpen(callback)
```

Parameters:

  * `callback` - function that will be called when the socket is opened

### onClose

```js
mySocket.onClose(callback)
```

Parameters:

  * `callback` - function that will be called when the socket is closed

### onTransaction

```js
mySocket.onTransaction(callback, options)
```

Parameters:

  * `callback` - function that will be called when a new transaction is broadcasted, gets passed a transaction json object

Options (optional):

  * `addresses` - array of bitcoin addresses to watch for new transactions
  * `setTxMini` - if set to `true` the websocket will respond with minimal transaction json objects

Minimal Tx:

```json
{
  "time": 1449263035,
  "value": 4185461,
  "txIndex": 114394115,
  "hash": "a6deea4c335800fcc276002d12fd65d780a1d2b38f7a705b439eccf497931393"
}
```

### onBlock

```js
mySocket.onBlock(callback)
```

Parameters:

  * `callback` - function that will be called when a new block is written to the block chain, gets passed a block json object
