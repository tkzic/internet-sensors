// 5/22/2013
//
// this appears to be the simplest way to stream the ar drone camera to a web page
// 
// it was adapted from the createServer example that is provided with the node dronestream module
//
// you need to have an index.html file in the same folder as this.
//
// to invoke: node ./tz-app.js
//
// then use Chrome to connect to the webpage. for example: 192.168.1.140:5555
//

var http = require("http");

// var    drone = require("../../index");
var    drone = require("dronestream");

var server = http.createServer(function(req, res) {
  require("fs").createReadStream(__dirname + "/index.html").pipe(res);
});

drone.listen(server);
// tz added explicit static ip address to allow another computer on the LAN to connect to this stream
// otherwise you can use "localhost" or not specify a host arg
// server.listen(5555, "192.168.1.140");
server.listen(5555,"localhost");