var urls = ["https://insight.bitpay.com/", "https://www.localbitcoinschain.com/", "https://search.bitaccess.co/"]

var io = require('socket.io-client')
var connected = false
var connect_to_insight = function() {
  if (connected === false) {
    var url = urls.shift()
    if (url != undefined) {
      var socket = io(url);
      setTimeout(function() {
        console.log('trying again...')
        if (connected === false) {
          socket.disconnect()
          connect_to_insight()
        }
      }, 5000)

      socket.on('connect', function() {
        console.log('connect!')
        connected = true
        console.log()
        socket.emit('subscribe', 'inv')
      });
      socket.on('tx', function(data) {
        console.log("New transaction received: " + JSON.stringify(data))
      })
      socket.on('event', function(data) {
        console.log('event', data)
      });
      socket.on('disconnect', function() {
        console.log('disconnect!')
      });
      socket.on('error', function() {
        console.log('error!')
      });
    }
  }
}
connect_to_insight()