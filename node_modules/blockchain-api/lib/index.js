'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.chain = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _request = require('request');

var request = _interopRequireWildcard(_request);

var _querystring = require('querystring');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * let block = new chain();
 * let wallet1 = block.wallet(guid, pass1, pass2);
 * wallet.my..
 * let wallet2 = block.wallet(guid, pass1, pass2);
 * wallet.my..
 */
exports.default = chain;

var chain = exports.chain = function () {
	function chain(_ref) {
		var _ref$domain = _ref.domain;
		var domain = _ref$domain === undefined ? 'https://blockchain.info/' : _ref$domain;
		var _ref$lang = _ref.lang;
		var lang = _ref$lang === undefined ? 'es' : _ref$lang;
		var _ref$api = _ref.api;
		var api = _ref$api === undefined ? 'https://api.blockchain.info/v2/' : _ref$api;

		_classCallCheck(this, chain);

		this._url = domain + lang + '/';
		this._api = api;
	}
	/**
  * Constrctor BlockChain
  * @param  {String} options.domain Domain
  * @param  {String} options.lang   Lang 
  * @param  {String} options.api    The new API
  */


	_createClass(chain, [{
		key: 'createWallet',
		value: function createWallet(obj, callback) {
			this.__Sender(this._url + 'api/v2/create_wallet', obj, callback);
		}
	}, {
		key: 'chart',
		value: function chart(type, callback) {
			this.__Sender(this._url + 'charts/' + type, { format: chain.format }, callback);
		}
	}, {
		key: 'ticker',
		value: function ticker(callback) {
			this.__Sender(this._url + 'ticker', params, callback);
		}
	}, {
		key: 'toBTC',
		value: function toBTC() {
			var currency = arguments.length <= 0 || arguments[0] === undefined ? 'USD' : arguments[0];
			var value = arguments.length <= 1 || arguments[1] === undefined ? 100 : arguments[1];
			var callback = arguments[2];

			this.__Sender(this._url + 'tobtc', { currency: currency, value: value }, callback);
		}
	}, {
		key: 'stats',
		value: function stats(callback) {
			this.__Sender(this._url + 'stats', params, callback);
		}

		/**
   * Wallet
   * @param  {string} guid  GUID
   * @param  {string} pass1 Password frist
   * @param  {string} pass2 Password second
   * @return {object}       The wallet
   */

	}, {
		key: 'wallet',
		value: function wallet(guid, password, second_password) {
			var _this = this;

			this.wallet.balance = function (cb) {
				return _this.__Sender(_this._url + 'merchant/' + guid + '/balance', { password: password }, cb);
			};
			this.wallet.list = function (cb) {
				return _this.__Sender(_this._url + 'merchant/' + guid + '/list', { password: password }, cb);
			};
			this.wallet.addressBalance = function (address) {
				var confirmations = arguments.length <= 1 || arguments[1] === undefined ? 3 : arguments[1];
				var cb = arguments[2];
				return _this.__Sender(_this._url + 'merchant/' + guid + '/address_balance', { password: password, address: address, confirmations: confirmations }, cb);
			};

			this.wallet.newAddress = function (label, cb) {
				return _this.__Sender(_this._url + 'merchant/' + guid + '/new_address', { password: password, second_password: second_password, label: label }, cb);
			};

			this.wallet.archiveAddress = function (address, cb) {
				return _this.__Sender(_this._url + 'merchant/' + guid + '/archive_address', { password: password, second_password: second_password, address: address }, cb);
			};

			this.wallet.unarchiveAddress = function (address, cb) {
				return _this.__Sender(_this._url + 'merchant/' + guid + '/unarchive_address', { password: password, second_password: second_password, address: address }, cb);
			};

			this.wallet.autoConsolidate = function (days, cb) {
				return _this.__Sender(_this._url + 'merchant/' + guid + '/auto_consolidate', { password: password, second_password: second_password, days: days }, cb);
			};

			this.wallet.payment = function (to, amount, obj, cb) {
				var params = { to: to, amount: amount, password: password, second_password: second_password };

				if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) == 'object') {
					for (var i in obj) {
						params[i] = obj[i];
					}
				}

				_this.__Sender(_this._url + 'merchant/' + guid + '/payment', params, cb);
			};

			this.wallet.sendMany = function (recipients, obj, cb) {
				var params = { recipients: JSON.stringify(recipients), password: password, second_password: second_password };

				if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) == 'object') {
					for (var i in obj) {
						params[i] = obj[i];
					}
				}

				_this.__Sender(_this._url + 'merchant/' + guid + '/sendmany', obj, cb);
			};
			return this.wallet;
		}

		/**
   * Query for BlockChain
   * @param  {String} q Path
   * @return {Object}   This query;
   */

	}, {
		key: 'query',
		value: function query() {
			var _this2 = this;

			var q = arguments.length <= 0 || arguments[0] === undefined ? 'q' : arguments[0];

			this.query.getDifficulty = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/getdifficulty', obj, cb);
			};
			this.query.getBlockCount = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/getblockcount', obj, cb);
			};
			this.query.latesthash = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/latesthash', obj, cb);
			};
			this.query.bcperBlock = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/bcperblock', obj, cb);
			};
			this.query.totalBc = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/totalbc', obj, cb);
			};
			this.query.probability = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/probability', obj, cb);
			};
			this.query.hashestowin = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/hashestowin', obj, cb);
			};
			this.query.nextreTarget = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/nextretarget', obj, cb);
			};
			this.query.avgtxSize = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/avgtxsize', obj, cb);
			};
			this.query.avgtxValue = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/avgtxvalue', obj, cb);
			};
			this.query.interval = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/interval', obj, cb);
			};
			this.query.eta = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/eta', obj, cb);
			};
			this.query.avgtxNumber = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/avgtxnumber', obj, cb);
			};
			this.query.getReceivedByAddress = function (address, cb) {
				return _this2.__Sender('' + _this2._url + q + '/getreceivedbyaddress/' + address, {}, cb);
			};
			this.query.getSentByAddress = function (address, cb) {
				return _this2.__Sender('' + _this2._url + q + '/getsentbyaddress/' + address, {}, cb);
			};
			this.query.addressBalance = function (address, cb) {
				return _this2.__Sender('' + _this2._url + q + '/addressbalance/' + address, {}, cb);
			};
			this.query.addressFirstseen = function (address, obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/addressfirstseen/' + address, obj, cb);
			};
			this.query.txTotalbtcOutput = function (hash, obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/txtotalbtcoutput/' + hash, obj, cb);
			};
			this.query.txTotalbtcInput = function (hash, obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/txtotalbtcoutput/' + hash, obj, cb);
			};
			this.query.txFee = function (hash, obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/txtotalbtcoutput/' + hash, obj, cb);
			};
			this.query.txResult = function (hash, address, obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/txresult/' + hash + '/' + address, obj, cb);
			};
			this.query.hashtontxid = function (hash, obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/hashtontxid/' + hash, obj, cb);
			};
			this.query.ntxidtohash = function (hash, obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/ntxidtohash/' + hash, obj, cb);
			};
			this.query.addressToHash = function (address, obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/addresstohash/' + address, obj, cb);
			};
			this.query.hashToAddress = function (hash, obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/hashtoaddress/' + hash, obj, cb);
			};
			this.query.hashPubKey = function (hash, obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/hashpubkey/' + hash, obj, cb);
			};
			this.query.addrPubKey = function (hash, obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/addrpubkey/' + hash, obj, cb);
			};
			this.query.pubKeyAddr = function (hash, obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/pubkeyaddr', obj, cb);
			};
			this.query.newKey = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/newkey', obj, cb);
			};
			this.query.unconfirmedCount = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/unconfirmedcount', obj, cb);
			};
			this.query.price24hr = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/24hrprice', obj, cb);
			};
			this.query.marketCap = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/marketcap', obj, cb);
			};
			this.query.transactionCount24hr = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/24hrtransactioncount', obj, cb);
			};
			this.query.btcsent24hr = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/24hrbtcsent', obj, cb);
			};
			this.query.hashRate = function (obj, cb) {
				return _this2.__Sender('' + _this2._url + q + '/hashrate', obj, cb);
			};

			return this.query;
		}

		/**
   * API old
   * @return {Object}        The methods in API
   */

	}, {
		key: 'api',
		value: function api() {
			var _this3 = this;

			var format = chain.format;
			/**
    * Adress
    * @param  {String|Array}   types    [description]
    * @param  {Function}       callback [description]
    */
			this.api.address = function (types, callback) {
				var urx = 'address';
				var active = null;
				if (Array.isArray(types)) {
					active = types.join('|');
					urx = 'multiaddr';
					types = '';
				}
				_this3.__Sender(_this3._url + urx + '/' + types, { format: format, active: active }, callback);
			};
			/**
    * [description]
    * @param  {String|Array}   active   [description]
    * @param  {Function}       callback [description]
    */
			this.api.unspent = function (active, callback) {
				if (!Array.isArray(active)) {
					active = [active];
				}
				active = active.join('|');
				_this3.__Sender(_this3._url + 'unspent', { format: format, active: active }, callback);
			};

			this.api.rawblock = function (types, callback) {
				return _this3.__Sender(_this3._url + 'rawblock/' + types, { format: format }, callback);
			};
			this.api.rawTx = function (types, callback) {
				return _this3.__Sender(_this3._url + 'rawtx/' + types, { format: format }, callback);
			};
			this.api.blockHeight = function (types, callback) {
				return _this3.__Sender(_this3._url + 'block-height/' + types, { format: format }, callback);
			};
			this.api.latestblock = function (callback) {
				return _this3.__Sender(_this3._url + 'latestblock', params, callback);
			};
			this.api.unconfirmedTransactions = function (callback) {
				return _this3.__Sender(_this3._url + 'unconfirmed-transactions', { format: format }, callback);
			};
			this.api.blocks = function (types, callback) {
				return _this3.__Sender(_this3._url + 'blocks/' + types, { format: format }, callback);
			};
			this.api.inv = function (types, callback) {
				return _this3.__Sender(_this3._url + 'inv/' + types, { format: format }, callback);
			};

			return this.api;
		}
		/**
   * Receive Payments
   * @param  {String} key API Key create for BlockChain
   * @return {Object}     The methods
   */

	}, {
		key: 'receivePayments',
		value: function receivePayments() {
			var _this4 = this;

			var key = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

			this.receivePayments.receive = function (xpub, callback, cb) {
				return _this4.__Sender(_this4._api + 'receive', { key: key, xpub: xpub, callback: callback }, cb);
			};
			this.receivePayments.callbackLog = function (callback, cb) {
				return _this4.__Sender(_this4._api + 'receive/callback_log', { key: key, callback: callback }, cb);
			};

			return this.receivePayments;
		}

		/**
   * Send the request
   * @param  {String}   method   Url to crete the request
   * @param  {object}   obj      Params incert
   * @param  {Function} callback Function to callback
   */

	}, {
		key: '__Sender',
		value: function __Sender(method, obj, callback) {
			request(method + '?' + (0, _querystring.stringify)(obj), function (err, response, body) {
				if (err || response.statusCode !== 200) {
					return callback(new Error(err ? err : response.statusCode));
				}

				try {
					var result = JSON.parse(body);
					if (result && result.error) {
						return callback(new Error(result.error), result);
					}

					callback(null, result);
				} catch (err) {
					return callback(err);
				}
			});
		}
	}]);

	return chain;
}();

chain.format = 'json';