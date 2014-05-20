//
// drone5.js - Max OSC server for nodecopter ar-drone

// allows Max to send commands and get telemetry back

// usage: node ./drone5 [optional telemetry target IP]

// The optional IP is if you want to use this program as a server on a LAN
// and control the drone using Max on another computer. Then you can specify
// The IP of that other computer 
//
// in that case I recommend running this server computer with a static IP
// I'm using 192.168.1.140 but it doesn't need to be hardwired into this code

// OSC ports:
// 4000		// listen for incoming max messages on this port
// 4001		// send response messages to max on this port

var fs = require('fs');

// drone code

var counter = 0;	// to slow down telemetry stream
var telemetry = 50;	// send every 50th time

var arDrone = require('ar-drone');
var client  = arDrone.createClient();

// create client object

client.config('general:navdata_demo', 'FALSE'); // get all the telemetry data

// blink the LED's to let you know its running...

 client.animateLeds('blinkGreenRed', 5, 10);	// blink the drone



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

// create upd server
var dserver = dgram.createSocket('udp4');

//
// if you are running max somewhere else, just change the ip address here to your location
//

var dPort = 4000;		// listen for incoming max messages on this port
var dSendPort = 4001;	// send response messages to max on this port
//

// now getting the ip address from command line arg:

var dSendAddress = '127.0.0.1';	// send response messages to max at this address
// do this if max is running somewhere other than the same computer as the node server
// var dSendAddress = '192.168.1.104';	// send response messages to max at this address

var outdoor = "FALSE";

// process command line args
//
// [targetIP] [outdoor]
//
// example: drone 192.168.1.140 TRUE
//
// as optional target IP for OSC
//
process.argv.forEach(function (val, index, array) {
	// console.log(index + ': ' + val);
	if(index == 2) {
		dSendAddress = val;
		console.log('new telemetry target: ' + dSendAddress);
	}
	else if (index == 3) {
		outdoor = val;
		console.log('outdoor: ' +  outdoor);
	}
	
});

// reset for outdoor conditions based on args...

	client.config("control:outdoor", outdoor );
	
// remove altitude restrictions...

	client.config("control:altitude_max", "10000" );	

// UDP event handlers

//  emergency landing
//	console.log("running /land");
//	client.land();

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


// takeoff callback - not working 
function tcb() {
	console.log('hovering...');
}

// osc message handler
function dispatchOSC(msg) {
	
	// testing
	if(msg.address == '/welcome') {
		console.log("running /welcome");
		/*
		if(msg.values.length > 2) {
			maxMessage[msg.values[0]] = 'welcome ' + msg.values[0] + ' ' + msg.values[1] + ' ' + msg.values[2];
 		}
		*/
	}
	// send ack to Max
	else if(msg.address == '/loopback') {
		console.log("running /loopback");
		sendMaxLoopback(msg.values[0]);	
	}
	
	// actual drone commands...
	
	// set rate of telemetry getting sent to Max 0 = fastest, 50 = slowest
	else if(msg.address == '/telemetry') {
		console.log("running /telemetry: " + msg.values[0]);
		telemetry = parseInt(msg.values[0]);
	}	
	
	else if(msg.address == '/reset' || msg.addres == '/disableEmergency') {
		console.log("running /reset");
		client.disableEmergency();
	}
	
	else if(msg.address == '/takeoff') {
		console.log("running /takeoff");
		// client.takeoff(tcb);
		client.takeoff();
	}
	


	else if(msg.address == '/land') {
		console.log("running /land");
		client.land();	
	}
	
	
	else if(msg.address == '/up') {
		console.log("running /up: " + msg.values[0]);
		client.up(parseFloat(msg.values[0])); 
	}
	else if(msg.address == '/down') {
		console.log("running /down: " + msg.values[0]);
		client.down(parseFloat(msg.values[0]));
	}
	
	else if(msg.address == '/clockwise') {
		console.log("running /clockwise: " + msg.values[0]);
		client.clockwise(parseFloat(msg.values[0]));	
	}
	else if(msg.address == '/counterClockwise') {
		console.log("running /counterClockwise: " + msg.values[0]);
		client.counterClockwise(parseFloat(msg.values[0]));	
	}
	
	else if(msg.address == '/front') {
		console.log("running /front: " + msg.values[0]);
		client.front(parseFloat(msg.values[0])); 
	}
	else if(msg.address == '/back') {
		console.log("running /back: " + msg.values[0]);
		client.back(parseFloat(msg.values[0]));
	}
	
	else if(msg.address == '/left') {
		console.log("running /left: " + msg.values[0]);
		client.left(parseFloat(msg.values[0])); 
	}
	else if(msg.address == '/right') {
		console.log("running /right: " + msg.values[0]);
		client.right(parseFloat(msg.values[0]));
	}
		
	else if(msg.address == '/hover') {
		console.log("running /hover (stop)");
		client.stop();	
	}
	
	else if(msg.address == '/config') {
		console.log("running /config" + ' ' + msg.values[0] + ', ' + msg.values[1]);
		client.config(msg.values[0], msg.values[1]);
	}	
	
	
	else if(msg.address == '/animate') {
		console.log("running /animate" + ' ' + msg.values[0] + ', ' + msg.values[1]);
		client.animate(msg.values[0], parseFloat(msg.values[1]));
	}
	
	else if(msg.address == '/animateLeds') {
		console.log("running /animateLeds" + ' ' + msg.values[0] + ', ' + msg.values[1], + ', ' + msg.values[2]);
		client.animateLeds(msg.values[0], parseInt(msg.values[1]), parseInt(msg.values[2]) );
	}

}

// nofity Max when new user connects
function sendMaxLoopback(val) {
	
	var buf = new Buffer ( oscLib.createOSCMsg('/loopback',["f"],[val]));
	dserver.send( buf, 0, buf.length, dSendPort, dSendAddress );
	
}


// code to send drone client telemetry to max via osc

// counter check determines how frequently data gets sent
// for example, 50 means to send every 50th reading
// 1 means to send every time



client.on('navdata', function(data){
	counter = counter + 1;		// thin the data if necessary
	if(counter > telemetry) {
		counter = 0;
		var raw_data_header = new Object();

		if(data.rawMeasures && data.demo && data.pwm){
			raw_data_header = {
				header: {
					time: data.time
					, sequenceNumber: data.sequenceNumber
					, flying: data.droneState.flying
					, batteryMilliVolt: data.rawMeasures.batteryMilliVolt
					, altitude: data.demo.altitude
					, velocity: {x: data.demo.xVelocity
								, y: data.demo.yVelocity
								, z: data.demo.zVelocity}
					, throttle: {forward: data.pwm.gazFeedForward
								, height: data.pwm.gazAltitude}
				}
			};
		}else{
			raw_data_header = {
				header: {
					time: data.time
					, sequenceNumber: data.sequenceNumber
					, flying: data.droneState.flying
					, batteryMilliVolt: 0
					, altitude: 0
					, velocity: {x: 0
								, y: 0
								, z: 0}
					, throttle: {forward: 0
								, height: 0}
				}
			};
		}

		var data_to_be_sent = JSON.stringify(raw_data_header);
	
		// send a bunch of stuff to max
		// altitude
		var altitude = raw_data_header.header.altitude;
		//console.log("altitude:" + altitude);
		var buf = new Buffer ( oscLib.createOSCMsg('/altitude',["f"],[parseFloat(altitude)]));
		dserver.send( buf, 0, buf.length, dSendPort, dSendAddress );
		
		// time
		var time = raw_data_header.header.time;
		//console.log("time:" + time);
		var buf = new Buffer ( oscLib.createOSCMsg('/time',["f"],[parseFloat(time)]));
		dserver.send( buf, 0, buf.length, dSendPort, dSendAddress );
		
		// flying state
		var flying = raw_data_header.header.flying;
		//console.log("flying:" + flying);
		var buf = new Buffer ( oscLib.createOSCMsg('/flying',["i"],[parseInt(flying)]));
		dserver.send( buf, 0, buf.length, dSendPort, dSendAddress );
		
		// battery
		var battery = raw_data_header.header.batteryMilliVolt;
		//console.log("battery:" + battery);
		var buf = new Buffer ( oscLib.createOSCMsg('/battery',["f"],[parseFloat(battery)]));
		dserver.send( buf, 0, buf.length, dSendPort, dSendAddress );

		// velocity
		var typeArray = new Array();
		typeArray.push("f");
		typeArray.push("f");
		typeArray.push("f");
		var velocity = raw_data_header.header.velocity;
		//console.log("velocity:" + velocity);
		var valueArray = [parseFloat(velocity.x), parseFloat(velocity.y), parseFloat(velocity.z) ];
		var buf = new Buffer ( oscLib.createOSCMsg('/velocity',typeArray,valueArray));
		dserver.send( buf, 0, buf.length, dSendPort, dSendAddress );
				
		// throttle
		var typeArray = new Array();
		typeArray.push("f");
		typeArray.push("f");
		var throttle = raw_data_header.header.throttle;
		//console.log("throttle:" + throttle);
		var valueArray = [parseFloat(throttle.forward), parseFloat(throttle.height) ];
		var buf = new Buffer ( oscLib.createOSCMsg('/throttle',typeArray,valueArray));
		dserver.send( buf, 0, buf.length, dSendPort, dSendAddress );				
		
		
		}
 
	}); // client on navdata

	
console.log('starting');

