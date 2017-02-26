'use strict';

var createCustomError = require('custom-error-generator');
var util = require('util');
var RatesApiError = createCustomError('RatesApiError', null, errorConstructor);

function errorConstructor(message, data) {
  if (typeof data === 'object' && !util.isError(data)) {
    this.errno = data.message;
    this.status = this.statusCode = data.status;
  }
}

module.exports = RatesApiError;