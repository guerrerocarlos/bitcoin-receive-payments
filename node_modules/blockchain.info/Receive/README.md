
# Blockchain.info Receive Module

Receive custom payment notifications. [View full API documentation](https://blockchain.info/api/api_receive).

## Importing

```js
var Receive = require('blockchain.info/Receive')
```

## Usage

Creating a new instance for receiving payments:

```js
var myReceive = new Receive(xpub, callback, key)
```

Parameters (required):

  * `xpub` - a [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) extended public key for generating bitcoin addresses
  * `callback` - the url that you want to receive payment notifications to (ex: `'http://mysite.com/receive'`)
  * `key` - your blockchain.info API v2 key (click [here](https://api.blockchain.info/v2/apikey/request/) to request a key)

## Methods

### generate

```js
myReceive.generate(query)
```

Generate the next address for the xpub used to initialize `myReceive`.

Parameters:

  * `query` - Object of key/value pairs that will be added to the query string of the callback url as arguments. Although this is not required, it is highly recommended that you include a `secret` query parameter for security.

Responds with an object containing the following properties:

  * `address` - the newly generated address, this is where your customer should send bitcoin
  * `index` - the index of the newly generated address
  * `callback` - the full callback url to which payment notifications will be sent
