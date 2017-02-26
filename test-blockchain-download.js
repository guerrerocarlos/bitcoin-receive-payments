var PeerGroup = require('bitcoin-net').PeerGroup
var HeaderStream = require('blockchain-download').HeaderStream
var Blockchain = require('blockchain-spv')
var params = require('webcoin-bitcoin')
var levelup = require('levelup')
  // connect to P2P network 
var peers = new PeerGroup(params.net)
peers.connect()
console.log('connect?')

// create/load Blockchain 
var db = levelup('bitcoin.chain', { db: require('memdown') })
var chain = new Blockchain(params.blockchain, db)

chain.createLocatorStream() // locators tell us which headers to fetch 
  .pipe(HeaderStream(peers)) // pipe locators into new HeaderStream 
  .pipe(chain.createWriteStream()) // pipe headers into Blockchain