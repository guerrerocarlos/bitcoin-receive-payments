'use strict';

var url = require('url');

function getRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function parseAddress(address) {
  // if address has a protocol in it, we don't need to add a fake one
  if (/^\w+:\/\//.test(address)) return url.parse(address);
  return url.parse('x://' + address);
}

function assertParams(params) {
  // TODO: check more things
  // TODO: give more specific errors
  if (!params || params.magic == null || !params.defaultPort) {
    throw new Error('Invalid network parameters');
  }
}

module.exports = { getRandom: getRandom, parseAddress: parseAddress, assertParams: assertParams };