'use strict';

var debug = require('debug')('openexchangerates-api');
var RatesApiError = require('./error');
var request = require('request');
var util = require('util');

var defaults = {
  apiBase: 'openexchangerates.org/api',
  ssl: true
};




/**
 * Expose RatesApi
 */
module.exports = RatesApi;




/**
 * We could use lodash.extend or similar but there is no need.
 *
 * @param {Object} dest
 * @param {Object} source
 * @returns {Object} Merged options
 */
function extend(dest, source) {
  if (arguments.length > 2) {
    return [].reduce.call(arguments, function(prev, current) {
      return extend(prev, current);
    });
  }

  var k;
  for (k in source) {
    if (source.hasOwnProperty(k)) {
      if (typeof dest[k] !== 'object') {
        dest[k] = source[k];
      }
      else {
        dest[k] = extend(dest[k], source[k]);
      }
    }
  }

  return dest;
}




function fillZeroes(num, zeroCount) {
  zeroCount -= (num + '').length;
  return new Array(zeroCount + 1).join('0') + num;
}




/**
 * Format date to YYYY-MM-DD pattern
 *
 * @param {Date} date
 * @returns {String} Formatted date string
 */
function fmtDate(date) {
  return fillZeroes(date.getFullYear(), 4) + '-' +
    fillZeroes(date.getMonth() + 1, 2) + '-' +
    fillZeroes(date.getDate(), 2);
}




/**
 * API client class
 *
 * @constructor
 * @param {Object} options
 *  Options object
 * @param {String} options.appId
 *  APP ID
 * @param {String} [options.apiBase=openexchangerates.org/api]
 *  API base URL
 * @param {Boolean} [options.ssl=true]
 *  Use HTTP instead of HTTP. True by default.
 * @param {Object} [options.request={}]
 *  Additional parameters for request
 */
function RatesApi(options) {
  this.options = extend({}, defaults, options);

  debug('Initialized client with following options: %j', this.options);
}




/**
 * Wrapper over `request` module for making API calls
 *
 * @private
 * @param {String} endpoint API endpoint
 * @param {Object} [data] Request options
 * @param {Function} callback Callback function
 */
RatesApi.prototype._request = function(endpoint, data, callback) {
  data = data || {};

  var url;
  var qs = data.qs || {};

  if (this.options.ssl) {
    url = 'https://'
  }
  else {
    url = 'http://'
  }

  url += this.options.apiBase + endpoint;

  if (data.noauth !== true) {
    qs.app_id = this.options.appId;

    if (!qs.app_id) {
      return callback(new RatesApiError('appId is needed for this request'));
    }
  }

  function handleResponse(err, res, data) {
    if (err) {
      callback(new RatesApiError('Unknown API error: %s', err.message, err));
      return;
    }

    if (!data) {
      data = {
        error: true,
        message: 'unknown',
        description: 'Unknown API error',
        status: res.statusCode
      };
    }

    if (data.error === true) {
      callback(new RatesApiError(data.description, data));
    }
    else {
      callback(null, data);
    }
  }

  debug('Request %s with following parameters: %j', url, qs);

  var req = extend({}, this.options.request, {
    method: 'GET',
    url: url,
    qs: qs,
    json: true
  });

  debug(req);

  request(req, handleResponse);
};




/**
 * Get list of available currencies and their names
 *
 * @see RatesApi#_request
 * @public
 * @param {Number} value Amount
 * @param {String} from From-currency 3-letter code
 * @param {String} to To-currency 3-letter code
 * @param {Object} [qs] Additional query string parameters
 * @param {Function} callback Callback function
 */
RatesApi.prototype.convert = function(value, from, to, qs, callback) {
  if (arguments.length === 4) {
    callback = qs;
    qs = {};
  }

  if (!value || !from || !to) {
    return callback(new Error(':value, :from, :to are mandatory'));
  }

  var endpoint = ['/convert', value, from, to].join('/');
  this._request(endpoint, qs, callback);
};




/**
 * Get list of available currencies and their names
 *
 * @see RatesApi#_request
 * @public
 * @param {Function} callback Callback function
 */
RatesApi.prototype.currencies = function(callback) {
  this._request('/currencies.json', { noauth: true }, callback);
};




/**
 * Get rates for given day
 *
 * @see RatesApi#_request
 * @public
 * @param {Date} date Date for which we want rates
 * @param {Object} [qs] Additional query string parameters
 * @param {Function} callback Callback function
 */
RatesApi.prototype.historical = function(date, qs, callback) {
  if (arguments.length === 2) {
    callback = qs;
    qs = undefined;
  }

  if (!util.isDate(date)) {
    return callback(new Error('Invalid date specified'));
  }

  var dateString = fmtDate(date);
  var endpoint = '/historical/' + dateString + '.json';

  this._request(endpoint, {
    qs: qs
  }, callback);
};




/**
 * Get latest rates
 *
 * @see RatesApi#_request
 * @public
 * @param {Object} [qs] Additional query string parameters
 * @param {Function} callback Callback function
 */
RatesApi.prototype.latest = function(qs, callback) {
  if (arguments.length === 1) {
    callback = qs;
    qs = undefined;
  }

  this._request('/latest.json', {
    qs: qs
  }, callback);
};




/**
 * Time-Series / Bulk request
 *
 * @see RatesApi#_request
 * @public
 * @param {Date} start Start date
 * @param {Date} end End date
 * @param {Object} [qs] Additional query string parameters
 * @param {Function} callback Callback function
 */
RatesApi.prototype.timeSeries = function(start, end, qs, callback) {
  if (arguments.length === 3) {
    callback = qs;
    qs = {};
  }

  if (!qs.symbols || !qs.currencies) {
    debug('Warning. ' +
    'It\'s strongly recommended to limit currencies for bulk request');
  }

  if (!util.isDate(start) || !util.isDate(end)) {
    return callback(new Error('Invalid start or end date'));
  }

  var diff = end.getTime() - start.getTime();
  if (diff < 0) {
    return callback(new Error('Start should earlier than end'));
  }

  qs.start = fmtDate(start);
  qs.end = fmtDate(end);

  this._request('/time-series.json', {
    qs: qs
  }, callback);
};
