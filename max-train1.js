// max-train1.js
//
// prototype for bi-directional communication between Max and the Web
// using Node.js
//
// this program runs a UDP server which receives messages from max
// when it receoves an OSC /gettrains message, it sends an http request 
// to the realtime Irish train website which returns XML data about current trains
// 
// The train data is parsed and sent back to max using OSC messages:
// like: /train id date time x y 
//
// Just as an exercise...
// It also sets up a web server which allows broswers to connect and send 'manual' train messages
// to max and get back a thank you message.

// note: this program doesn't handle errors gracefully, for example, unavailable services, blocking, bad data, etc.,

var app = require('http').createServer(handler)
, io = require('socket.io').listen(app)
,fs = require('fs');



// stuff specific to trains

var request = require('request');		// for http requests
var xml2js = require('xml2js');			// convert xml
var util = require('util');				// for friendly console displays

var parser = new xml2js.Parser();		// define xml to js converter


// for the client style OSC libs from Florian Demmer
// this hack makes the namespace for these files available without the 'require' and 'module' stuff
// note: there ought to be a better way to do this

// file is included here:
eval(fs.readFileSync('bigInt.js')+'');
// file is included here:
eval(fs.readFileSync('byteConverter.js')+'');
// file is included here:
eval(fs.readFileSync('libOSC.js')+'');

// continuation of hack

var byteConverter = ByteConverter.getInstance();
var oscLib = LibOSC.getInstance();


// end of hack

// for udp
var dgram = require('dgram');

var counter;

// create upd server
var dserver = dgram.createSocket('udp4');

//
// if you are running max somewhere else, just change the ip address here to your location
//
var dPort = 4000;		// listen for incoming max messages on this port
var dSendPort = 4001;	// send response messages to max on this port
//
   var dSendAddress = '127.0.0.1';	// send response messages to max at this address
// do this if max is running somewhere other than the same computer as the node server
// var dSendAddress = '192.168.1.104';	// send response messages to max at this address
 
// UDP event handlers

// triggered when listening starts

dserver.on('listening', function() {
    var address = dserver.address();
    console.log('server listening on ' + address.address + ':' + address.port);
});

// triggered by incoming message from max

dserver.on('message', function(message, rinfo) {
//  note: with message from remote machines
//  the port and address in rinfo refer to the router - not the actual source machine
//  so its not of any use for returning stuff
//  except on localhost

    console.log('got message: ' + message + ', length: ' + message.length + ' port: ' + rinfo.port + ' addr: ' + rinfo.address);

    var oscMsg = oscLib.parseOSCMsg(message);	// parse OSC from Max
    var functionId = oscMsg.address;			// address pattern (ie, OSC command)
    console.log('addresspattern: ' + functionId);

	// osc parser handles case where there are no args,
	//  by setting the arg[0] typeflag to '\u0000' but not defining a value 
	
	var oscArgCount = 0;
	if((oscMsg.values.length != 1) || (oscMsg.typeFlags[0] != '\u0000')) { 	
		oscArgCount = oscMsg.values.length;
	}

	// display incoming osc message
	
	console.log('number of osc args: ' + oscArgCount);
	console.log(oscMsg);

	// dispatch the message
	// note: here we may want to try to 'emit' a dispatch event 
	// or wrap this function in try/catch 
	
	dispatchOSC(oscMsg);

    
// this is how to echo the incoming message back to max for some fun...
//    dserver.send(message, 0, message.length, dSendPort, dSendAddress);

});

// start listening for incoming UDP
dserver.bind(dPort);

/////////////////////////////////////////////////
// this is the http stuff

// This is the port that the Node http server runs on
// change this port number if there are conflicts, or whatever
app.listen(8124);


var maxMessage = new Array();


// this sneaky bit of callback code reads the max.html file (located in the same directory as this script)
// and then who knows what
function handler (req, res) {
    console.log('inside handler');
    fs.readFile(__dirname + '/max.html',
		function (err, data) {
		    if (err) {
			res.writeHead(500);
			return res.end('Error loading max.html');
		    }
		    counter = 1;
		    res.writeHead(200);
		    res.end(data);
		});
}
// yes, this was stolen from a book on how to make a node chat server
// 
io.sockets.on('connection', function (socket) {
	
	// 
	
	// check for  max messages and pass back to user
	// this is some sketchy code
	var maxTimer = setInterval(function() {
		if(socket.username != 'undefined') {
			if(maxMessage[socket.username] != '') {
				socket.emit('chat', 'Max', 'Message: ' + maxMessage[socket.username]);
				// socket.volatile.emit(maxMessage[socket.username]);
				maxMessage[socket.username] = ''; // clear message
			}
		}
	}, 1000);
	




	// new client has connected via http
    socket.on('addme',function(username) {
		socket.username = username;
		// acknowledge connection
		socket.emit('chat', 'SERVER', 'You have connected');
		// broadcast to other connected users
		socket.broadcast.emit('chat', 'SERVER', username + ' is on deck');
		// notify max about the new user
		connectUserToMax(username);
		
    });



	// client is sending map point data which will be forwared to Max
    socket.on('sendchat', function(data) {
	io.sockets.emit('chat', socket.username, data);
	sendMapPointToMax(data,socket.username);
    });

	// client has disconnected
    socket.on('disconnect', function() {
	io.sockets.emit('chat', 'SERVER', socket.username + ' has left the building');
	// notify max about the former user
	disconnectUserToMax(socket.username);
	clearInterval(maxTimer);	// stop waiting to here anything from max
    });

});


// end of http stuff ////



//// general functions and such 

function sendMapPointToMax(data, username) {
	
	var typeArray = new Array();
	typeArray.push("s");
	typeArray.push("f");
	typeArray.push("f");
	typeArray.push("s");
	
	// parse tokens out of data string
	var tokens = data.split(' ');
	if(tokens.length < 3) return;
	
	var xy = latLonToMercator( parseFloat(tokens[1]), parseFloat(tokens[2]) );
	var valueArray = [tokens[0], xy.x, xy.y, username ];
		
	var buf = new Buffer ( oscLib.createOSCMsg('/map',typeArray,valueArray));
	dserver.send( buf, 0, buf.length, dSendPort, dSendAddress );
	
	
}

// nofity Max when new user connects
function connectUserToMax(username) {
	
	var buf = new Buffer ( oscLib.createOSCMsg('/connect',["s"],[username]));
	dserver.send( buf, 0, buf.length, dSendPort, dSendAddress );
	
}
// nofity Max when new user connects
function disconnectUserToMax(username) {
	
	var buf = new Buffer ( oscLib.createOSCMsg('/disconnect',["s"],[username]));
	dserver.send( buf, 0, buf.length, dSendPort, dSendAddress );
	
}


// osc message handler
function dispatchOSC(msg) {
	
	if(msg.address == '/gettrains') {	// make this not case sensitive
		getTrains();
	}
	else if(msg.address == '/welcome') {
		
		if(msg.values.length > 2) {
			maxMessage[msg.values[0]] = 'welcome ' + msg.values[0] + ' ' + msg.values[1] + ' ' + msg.values[2];
 		}
		
	}
		


}

// get train data, parse, and send to max
function getTrains() {
	
	
	request('http://api.irishrail.ie/realtime/realtime.asmx/getCurrentTrainsXML', function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    // console.log(body) // Print the web page.
		// convert to JSON
		parser.parseString(body, function(err, result) {
			console.log(util.inspect(result, false, null));  // this method displays entire json tree
			console.log('end of Irish train data...');
			trainsToMax(result);
		});
	  }
	  else {
		console.log('request error getting train data: ' + error);
	  }
	});
	


} // end of function getTrains()

// send all the current train data to max, as OSC messages
function trainsToMax(obj) {
	
// set up an array of data types for arg list in the OSC messages
// In this case string, float, float

	var typeArray = new Array();
	typeArray.push("s");
	typeArray.push("f");
	typeArray.push("f");
	
	if(typeof obj.ArrayOfObjTrainPositions.objTrainPositions != 'undefined') {
	   	obj.ArrayOfObjTrainPositions.objTrainPositions.forEach(function (train) {
			//		 console.log(train.TrainCode);
			//	     console.log(train.PublicMessage);
			//		 console.log('--');
			  
			// format a message in OSC and send it to max
			
			var xy = latLonToMercator( parseFloat(train.TrainLatitude), parseFloat(train.TrainLongitude) );
			var valueArray = [String(train.TrainCode), xy.x, xy.y ];
			
			var buf = new Buffer ( oscLib.createOSCMsg('/train',typeArray,valueArray));
			dserver.send( buf, 0, buf.length, dSendPort, dSendAddress );

		});

	}
	else {
		console.log('It looks like there are no trains running now.');
	}
	
	
}	

// convert lat lon to x y
function latLonToMercator(lat, lon) {
 
    var rMajor = 6378137; //Equatorial Radius, WGS84
    var shift  = Math.PI * rMajor;
    var x      = lon * shift / 180;
    var y      = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    y = y * shift / 180;
 
    return {'x': x, 'y': y};
}


	
console.log('starting');


