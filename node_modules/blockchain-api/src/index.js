import * as request from 'request';
import {stringify} from 'querystring';
/**
 * let block = new chain();
 * let wallet1 = block.wallet(guid, pass1, pass2);
 * wallet.my..
 * let wallet2 = block.wallet(guid, pass1, pass2);
 * wallet.my..
 */
export default chain;
export class chain {
	/**
	 * Constrctor BlockChain
	 * @param  {String} options.domain Domain
	 * @param  {String} options.lang   Lang 
	 * @param  {String} options.api    The new API
	 */
	static format = 'json';
	constructor({
		domain = 'https://blockchain.info/',
		lang =  'es',
		api ='https://api.blockchain.info/v2/',
	}) {
		this._url = domain + lang + '/';
		this._api = api;
	}

	createWallet (obj, callback){
		this.__Sender(`${this._url}api/v2/create_wallet`, obj, callback );
	}

	chart (type, callback) {
		this.__Sender(`${this._url}charts/${type}`, { format : chain.format }, callback );
	}

	ticker (callback) {
		this.__Sender(`${this._url}ticker`, params, callback );
	}

	toBTC (currency='USD', value=100, callback) {
		this.__Sender(`${this._url}tobtc`, { currency, value }, callback );
	}

	stats (callback) {
		this.__Sender(`${this._url}stats`, params, callback );
	}

	/**
	 * Wallet
	 * @param  {string} guid  GUID
	 * @param  {string} pass1 Password frist
	 * @param  {string} pass2 Password second
	 * @return {object}       The wallet
	 */
	wallet (guid, password, second_password) {
		this.wallet.balance = (cb) => this.__Sender(`${this._url}merchant/${guid}/balance`, { password }, cb);
		this.wallet.list = (cb) => this.__Sender(`${this._url}merchant/${guid}/list`, { password }, cb);
		this.wallet.addressBalance = (address, confirmations=3, cb) => this.__Sender(`${this._url}merchant/${guid}/address_balance`, { password, address, confirmations }, cb);

		this.wallet.newAddress = (label, cb) => this.__Sender(`${this._url}merchant/${guid}/new_address`, { password, second_password, label }, cb);

		this.wallet.archiveAddress = (address, cb) => this.__Sender(`${this._url}merchant/${guid}/archive_address`, { password, second_password, address }, cb);

		this.wallet.unarchiveAddress = (address, cb) =>  this.__Sender(`${this._url}merchant/${guid}/unarchive_address`, { password, second_password, address }, cb);

		this.wallet.autoConsolidate = (days, cb) => this.__Sender(`${this._url}merchant/${guid}/auto_consolidate`, { password, second_password, days }, cb);

		this.wallet.payment = (to, amount, obj, cb) => {
			let params = { to, amount, password, second_password };

			if(typeof obj == 'object'){
				for (let i in obj) {
					params[i] = obj[i];
				}
			}

			this.__Sender(`${this._url}merchant/${guid}/payment`, params, cb);
		};

		this.wallet.sendMany = (recipients, obj, cb) => {
			let params ={ recipients : JSON.stringify(recipients), password, second_password };
			
			if(typeof obj == 'object'){
				for (let i in obj) {
					params[i] = obj[i];
				}
			}

			this.__Sender(`${this._url}merchant/${guid}/sendmany`, obj, cb);
		};
		return this.wallet;
	}

	/**
	 * Query for BlockChain
	 * @param  {String} q Path
	 * @return {Object}   This query;
	 */
	query(q='q'){
		this.query.getDifficulty = (obj, cb) => this.__Sender(`${this._url}${q}/getdifficulty`, obj, cb);
		this.query.getBlockCount = (obj, cb) => this.__Sender(`${this._url}${q}/getblockcount`, obj, cb);
		this.query.latesthash = (obj, cb) => this.__Sender(`${this._url}${q}/latesthash`, obj, cb);
		this.query.bcperBlock = (obj, cb) => this.__Sender(`${this._url}${q}/bcperblock`, obj, cb);
		this.query.totalBc = (obj, cb) => this.__Sender(`${this._url}${q}/totalbc`, obj, cb);
		this.query.probability = (obj, cb) => this.__Sender(`${this._url}${q}/probability`, obj, cb);
		this.query.hashestowin = (obj, cb) => this.__Sender(`${this._url}${q}/hashestowin`, obj, cb);
		this.query.nextreTarget = (obj, cb) => this.__Sender(`${this._url}${q}/nextretarget`, obj, cb);
		this.query.avgtxSize = (obj, cb) => this.__Sender(`${this._url}${q}/avgtxsize`, obj, cb);
		this.query.avgtxValue = (obj, cb) => this.__Sender(`${this._url}${q}/avgtxvalue`, obj, cb);
		this.query.interval = (obj, cb) => this.__Sender(`${this._url}${q}/interval`, obj, cb);
		this.query.eta = (obj, cb) => this.__Sender(`${this._url}${q}/eta`, obj, cb);
		this.query.avgtxNumber = (obj, cb) => this.__Sender(`${this._url}${q}/avgtxnumber`, obj, cb);
		this.query.getReceivedByAddress = (address, cb) => this.__Sender(`${this._url}${q}/getreceivedbyaddress/${address}`,{}, cb);
		this.query.getSentByAddress = (address, cb) => this.__Sender(`${this._url}${q}/getsentbyaddress/${address}`, {}, cb);
		this.query.addressBalance = (address, cb) => this.__Sender(`${this._url}${q}/addressbalance/${address}`, {}, cb);
		this.query.addressFirstseen = (address, obj, cb) => this.__Sender(`${this._url}${q}/addressfirstseen/${address}`, obj, cb);
		this.query.txTotalbtcOutput = (hash, obj, cb) => this.__Sender(`${this._url}${q}/txtotalbtcoutput/${hash}`, obj, cb);
		this.query.txTotalbtcInput = (hash, obj, cb) => this.__Sender(`${this._url}${q}/txtotalbtcoutput/${hash}`, obj, cb);
		this.query.txFee = (hash, obj, cb) => this.__Sender(`${this._url}${q}/txtotalbtcoutput/${hash}`, obj, cb);
		this.query.txResult = (hash, address, obj, cb) => this.__Sender(`${this._url}${q}/txresult/${hash}/${address}`, obj, cb);
		this.query.hashtontxid = (hash, obj, cb) => this.__Sender(`${this._url}${q}/hashtontxid/${hash}`, obj, cb);
		this.query.ntxidtohash = (hash, obj, cb) => this.__Sender(`${this._url}${q}/ntxidtohash/${hash}`, obj, cb);
		this.query.addressToHash = (address, obj, cb) => this.__Sender(`${this._url}${q}/addresstohash/${address}`, obj, cb);
		this.query.hashToAddress =(hash, obj, cb) => this.__Sender(`${this._url}${q}/hashtoaddress/${hash}`, obj, cb);
		this.query.hashPubKey = (hash, obj, cb) => this.__Sender(`${this._url}${q}/hashpubkey/${hash}`, obj, cb);
		this.query.addrPubKey = (hash, obj, cb) => this.__Sender(`${this._url}${q}/addrpubkey/${hash}`, obj, cb);
		this.query.pubKeyAddr = (hash, obj, cb) => this.__Sender(`${this._url}${q}/pubkeyaddr`, obj, cb);
		this.query.newKey = (obj, cb) => this.__Sender(`${this._url}${q}/newkey`, obj, cb);
		this.query.unconfirmedCount = (obj, cb) => this.__Sender(`${this._url}${q}/unconfirmedcount`, obj, cb);
		this.query.price24hr = (obj, cb) => this.__Sender(`${this._url}${q}/24hrprice`, obj, cb);
		this.query.marketCap = (obj, cb) => this.__Sender(`${this._url}${q}/marketcap`, obj, cb);
		this.query.transactionCount24hr = (obj, cb) => this.__Sender(`${this._url}${q}/24hrtransactioncount`, obj, cb);
		this.query.btcsent24hr = (obj, cb) => this.__Sender(`${this._url}${q}/24hrbtcsent`, obj, cb);
		this.query.hashRate = (obj, cb) => this.__Sender(`${this._url}${q}/hashrate`, obj, cb);

		return this.query;
	}

	/**
	 * API old
	 * @return {Object}        The methods in API
	 */
	api (){
		let format = chain.format;
		/**
		 * Adress
		 * @param  {String|Array}   types    [description]
		 * @param  {Function}       callback [description]
		 */
		this.api.address = (types, callback) => {
			let urx = 'address';
			let active = null;
			if(Array.isArray(types)){
				active = types.join('|');
				urx = 'multiaddr';
				types = '';
			}
			this.__Sender(this._url + urx + '/' + types, { format, active }, callback );
		};
		/**
		 * [description]
		 * @param  {String|Array}   active   [description]
		 * @param  {Function}       callback [description]
		 */
		this.api.unspent = (active, callback) => {
			if(!Array.isArray(active)){
				active = [ active ];
			}
			active = active.join('|');
			this.__Sender(`${this._url}unspent`, { format, active }, callback );
		};

		this.api.rawblock = (types, callback) => this.__Sender(`${this._url}rawblock/${types}`, { format }, callback);
		this.api.rawTx = (types, callback) => this.__Sender(`${this._url}rawtx/${types}`, { format }, callback );
		this.api.blockHeight = (types, callback) => this.__Sender(`${this._url}block-height/${types}`, { format }, callback);
		this.api.latestblock = (callback) =>  this.__Sender(`${this._url}latestblock`, params, callback );
		this.api.unconfirmedTransactions = (callback) =>  this.__Sender(`${this._url}unconfirmed-transactions`, {format}, callback);
		this.api.blocks = (types, callback) => this.__Sender(`${this._url}blocks/${types}`, { format }, callback );
		this.api.inv = (types, callback) => this.__Sender(`${this._url}inv/${types}`, { format }, callback );

		return this.api;
	}
	/**
	 * Receive Payments
	 * @param  {String} key API Key create for BlockChain
	 * @return {Object}     The methods
	 */
	receivePayments (key=''){
		this.receivePayments.receive = (xpub, callback, cb) => this.__Sender(`${this._api}receive`, { key, xpub, callback }, cb);
		this.receivePayments.callbackLog = (callback, cb) => this.__Sender(`${this._api}receive/callback_log`, {key, callback}, cb);

		return this.receivePayments;
	}


	/**
	 * Send the request
	 * @param  {String}   method   Url to crete the request
	 * @param  {object}   obj      Params incert
	 * @param  {Function} callback Function to callback
	 */
	__Sender (method, obj, callback) {
		request(method + '?' + stringify(obj), (err, response, body) => {
			if(err || response.statusCode !== 200) {
				return callback(new Error(err ? err : response.statusCode));
			}

			try {
				let result = JSON.parse(body);
				if(result && result.error) {
					return callback(new Error(result.error), result);
				}

				callback(null, result);
			} catch (err) {
				return callback(err);
			}

			
		});
	}
}