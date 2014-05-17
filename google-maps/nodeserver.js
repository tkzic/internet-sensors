//
// this is a simple web server for testing
//

// need to specify actual ip for external connections.
// localhost doesn't work
//
// var ip = "192.168.1.104"
var ip = "127.0.0.1"

var sys = require("sys"),
path = require("path"),
http = require ("http"),
url = require ("url"),
fs = require("fs"),
debug = require("util"),
events = require("events");
<!--formatted-->

var http = require('http');
var port = 8081;
http.createServer(function (req, res) {
  var uri = url.parse(req.url).pathname;
  load_static_file(uri,res);
}).listen(port, ip);
console.log("Server running at http://" + ip + ":" + port + '/');

function load_static_file(uri, response) {
    var filename = path.join(process.cwd(), uri);  
 
    path.exists(filename, function(exists) {
        if(!exists) {
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.write(filename + "404 Not Found\n");
            response.end();
            return;
        }  
 
        fs.readFile(filename, "binary", function(err, file) {
            if(err) {
                response.writeHead(500, {"Content-Type": "text/plain"});
                response.write(err + "\n");
                response.end();
                return;
            }  
 
            response.writeHead(200);
            response.write(file, "binary");
            response.end();
        });
    });
}
