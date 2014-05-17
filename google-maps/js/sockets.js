// socketsOSC.js 
// 
// sort of an Osc parser for Web Audio Playground
//
// the Osc messages are just text strings by the time they get to here
//
// the sockets part is a web-sockets thing that recieves the text Osc messages from a 
// ruby server - which understands real OSC from devices and such
//
// first we need to set up a table to do range translation for the various 
// modules, so that the OSC number ranges coming in are all 0.0-1.0 - this allows for 
// generic configurations that work with various types of modules
//

// map x->y given ranges: xmin, xmax, ymin, ymax
// y = ((x - xmin) * (ymax - ymin) / (xmax - xmin)) + ymin
//
function linearMap(x, xMin, xMax, yMin, yMax ) {
	
	return ((x - xMin) * (yMax - yMin) / (xMax - xMin)) + yMin;
	
}

// slider, menu, toggle range object 
function ControlDescription() {
	
	this.name = "";
	this.controlType = "";
	this.min = 0;
	this.max = 0;
	this.default = 0;
	this.unitDescription = "";		// like hz, inches, miles, etc.,
	
	for (var n in arguments[0]) { this[n] = arguments[0][n]; }
	
}
// module description object
function ModuleDescription() {
	
	this.moduleType = "";
	
	// 
	this.slider = [];
	this.toggle = [];
	this.menu = [];
	this.checkbox = [];
	
	this.inputs = 0;
	this.outputs = 0;
	
	this.constructor = null;
	
	for (var n in arguments[0]) { this[n] = arguments[0][n]; }
}

moduleDescriptionList = [];	// place where all the module types are defined

function setupModuleDescriptionList() {
		
	// descibe the modules
	
	moduleDescriptionList[0] = new ModuleDescription({
		"moduleType" : "audiobuffersource",
		"toggle" : [new ControlDescription({
			"name" : "play", 	
			"controlType" : "toggle",
			"min" : 0,
			"max" : 1,
			"default" : 0,
			"unitDescription" : ""
			})],
		"menu" : [new ControlDescription({
			"name" : "file", 	
			"controlType" : "menu",
			"min" : 0,
			"max" : 6,
			"default" : 0,
			"unitDescription" : ""
			})],
		"checkbox" : [new ControlDescription({
			"name" : "loop", 	
			"controlType" : "checkbox",
			"min" : 0,
			"max" : 1,
			"default" : 0,
			"unitDescription" : ""
			})],
		"constructor" : createAudioBufferSourceFromMenu
	});
	
	
	moduleDescriptionList[1] = new ModuleDescription({
		"moduleType" : "oscillator",
		"slider" : [new ControlDescription({
			"name" : "frequency",
			"controlType" : "slider",
			"min" : 0.0,
			"max" : 8000.0,
			"default" : 440.0,
			"unitDescription" : "hz"
			}),
			new ControlDescription({
			"name" : "detune", 	
			"controlType" : "slider",
			"min" : -1200.0,
			"max" : 1200.0,
			"default" : 0.0,
			"unitDescription" : "cents"
			}),
			],
		"toggle" : [new ControlDescription({
			"name" : "play", 	
			"controlType" : "toggle",
			"min" : 0,
			"max" : 1,
			"default" : 0,
			"unitDescription" : ""
			})],
		"menu" : [new ControlDescription({
			"name" : "wave", 	
			"controlType" : "menu",
			"min" : 0,
			"max" : 4,
			"default" : 0,
			"unitDescription" : ""
			})],
		"checkbox" : [],
		"constructor" : createOscillator
	});
	
	
	moduleDescriptionList[2] = new ModuleDescription({
		"moduleType" : "live input",
		"toggle" : [],
		"menu" : [],
		"checkbox" : [],
		"constructor" : createLiveInput
	});
	
	moduleDescriptionList[3] = new ModuleDescription({
		"moduleType" : "biquadfilter",
		"slider" : [new ControlDescription({
			"name" : "frequency",
			"controlType" : "slider",
			"min" : 0.0,
			"max" : 20000.0,
			"default" : 440.0,
			"unitDescription" : "hz"
			}),
			new ControlDescription({
			"name" : "q", 	
			"controlType" : "slider",
			"min" : 1.0,
			"max" : 100.0,
			"default" : 1.0,
			"unitDescription" : ""
			}),
			new ControlDescription({
			"name" : "gain", 	
			"controlType" : "slider",
			"min" : 0.0,
			"max" : 10.0,
			"default" : 1.0,
			"unitDescription" : ""
			}),
			],		
	
		"menu" : [new ControlDescription({
			"name" : "filter", 	
			"controlType" : "menu",
			"min" : 0,
			"max" : 7,
			"default" : 0,
			"unitDescription" : ""
			})],
		"checkbox" : [],
		"constructor" : createBiquadFilter
	});
	

	moduleDescriptionList[4] = new ModuleDescription({
		"moduleType" : "delay",
		"slider" : [new ControlDescription({
			"name" : "delay time",
			"controlType" : "slider",
			"min" : 0.0,
			"max" : 10.0,
			"default" : 0.2,
			"unitDescription" : "sec"
			})
			],
		"toggle" : [],
		"menu" : [],
		"checkbox" : [],
		"constructor" : createDelay
	});
	
	
	moduleDescriptionList[5] = new ModuleDescription({
		"moduleType" : "dynamicscompressor",
		"slider" : [new ControlDescription({
			"name" : "threshold",
			"controlType" : "slider",
			"min" : -36.0,
			"max" : 0.0,
			"default" : -24.0,
			"unitDescription" : "db"
			}),
			new ControlDescription({
			"name" : "knee", 	
			"controlType" : "slider",
			"min" : 0.0,
			"max" : 40.0,
			"default" : 30.0,
			"unitDescription" : "db"
			}),
			new ControlDescription({
			"name" : "ratio", 	
			"controlType" : "slider",
			"min" : 1.0,
			"max" : 50.0,
			"default" : 12.0,
			"unitDescription" : ""
			}),
			],		

		"slider" : [new ControlDescription({
			"name" : "attack",
			"controlType" : "slider",
			"min" : 0.003,
			"max" : 1.0,
			"default" : 0.003,
			"unitDescription" : "sec"
			}),
			new ControlDescription({
			"name" : "release", 	
			"controlType" : "slider",
			"min" : 0.25,
			"max" : 2.0,
			"default" : 0.25,
			"unitDescription" : "sec"
			}),
			],
		
		"menu" : [],
		"checkbox" : [],
		"constructor" : createDynamicsCompressor
	});
	

	moduleDescriptionList[6] = new ModuleDescription({
		"moduleType" : "gain",
		"slider" : [new ControlDescription({
			"name" : "gain",
			"controlType" : "slider",
			"min" : 0.0,
			"max" : 10.0,
			"default" : 1.0,
			"unitDescription" : ""
			})
			],
		"toggle" : [],
		"menu" : [],
		"checkbox" : [],
		"constructor" : createGain
	});
	
	moduleDescriptionList[7] = new ModuleDescription({
		"moduleType" : "convolver",
		"slider" : [],
		"menu" : [new ControlDescription({
			"name" : "file", 	
			"controlType" : "menu",
			"min" : 0,
			"max" : 2,
			"default" : 0,
			"unitDescription" : ""
			})],
		"checkbox" : [new ControlDescription({
				"name" : "norm", 	
				"controlType" : "checkbox",
				"min" : 0,
				"max" : 1,
				"default" : 0,
				"unitDescription" : ""
				})],
		"constructor" : createConvolver
	});
	
	moduleDescriptionList[8] = new ModuleDescription({
		"moduleType" : "analyser",
		"toggle" : [],
		"menu" : [],
		"checkbox" : [],
		"constructor" : createAnalyser
	});

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// var ip = '69.49.153.74';
// var ip = '192.168.1.104';
var ip = 'localhost';
var port = '1234';


// attempt a local socket connection
function connectOSC() {
	
		try {
		var socket = new WebSocket("ws://" + ip + ":" + port); 


			console.log('<p class="event">Socket Status: '+socket.readyState);  

	        socket.onopen = function(){  
	             console.log('<p class="event">Socket Status: '+socket.readyState+' (open)');  
	        }  

	        socket.onmessage = function(msg){  
	            console.log('<p class="message">Received: '+msg.data);
				parseOSCMessage(msg.data);
	        }  

	        socket.onclose = function(){  
	             console.debug('<p class="event">Socket Status: '+socket.readyState+' (Closed)');  
	        }             

	    } catch(exception){  
	         console.log('<p>Error'+exception);  
	    }

	 // socket.send("hsdfhjkjshd");	
	
}


// var token, cmd;
//////////////////////////////////////
// handles incoming websockets messages
function parseOSCMessage(msg) {

	var token;
	var cmd;
	var mod;
	var a, b, c, d, e, f, g, h; // element refs
	var modNdx;	// module index
	var lat, lon;
	
	if((msg == null) || (msg == "")) {
		return;
	}
	
	token = msg.split(" ");	// split into tokens: command + data, data...
	
	cmd = token[0].split("/");  // split out command: point lat lon
	
	// the first token is blank in cmd
	
	// for this test, there's only one command: "/point" (for lat lon map point)
	// if it works, we'll set up a table and a state parser
	
	if(cmd[1] != "point") {
		return;
	}
	
	// now get latitude
	
	if( isNaN(token[1]) ) {
		return;
	}
	
	lat = parseFloat(token[1]);
	
	// now get longitude
	
	if( isNaN(token[2]) ) {
		return;
	}
	
	lon = parseFloat(token[2]);
	
	console.log("point received: " + lat + "," + lon);
	
	return;
	
	
	
	
	

	// get data value and control index - probably should do more checking on these tokens
	dataVal = parseFloat(token[1]);
	controlNdx = parseInt(cmd[4]);
	controlType = cmd[3];
	console.log("OSCparse: controlType: " + controlType);
	
	c = b[modNdx];		// ref to module element in DOM
	
	if(controlType == "slider") {
		// translate range from 0->1 to actual
		controlVal = linearMap( token[1], 0.0, 1.0, md.slider[controlNdx].min, md.slider[controlNdx].max );
		console.log("slider control value will be: " + controlVal );
		// now set the value 
	
		// sliderValues
		h = c.getElementsByClassName("content");
		if(h.length) {
			d = h[0].getElementsByTagName("input");	// range sliders
			if((d) && controlNdx < d.length) {		// should put out error message 
				d[controlNdx].value = controlVal;	// set value 
				d[controlNdx].oninput({target:d[controlNdx]});	// spoof event, passing self (element) as target
			}
		}
	}
	// another experiment in silliness
	// the toggle is actually more like a bang
	// it only applies to ocillator and abs play - for now - both use img tags 
	// with onclick functions attached...
	
	else if(controlType == "toggle") {
		// use actual value
		controlVal = parseInt( token[1] );  // 1 or 0
		console.log("toggle control value will be: " + controlVal );
		// now set the value - so far, Oscillator is only module with toggle 
	
		d = c.getElementsByTagName("img");
		if(d.length) {
			e = d[0].onclick;	// get event handler
			e({target:d[controlNdx]}); // and run it	
		}
	}
	
	else if(controlType == "menu") {
		// use actual value (menu index)
		controlVal = parseInt( token[1] );  // 
		console.log("menu control value will be: " + controlVal );
	
		// now set the value 
	
		f = c.getElementsByTagName("footer");
		if(f.length) {						// if there is a footer
			e = f[0].getElementsByTagName("select"); // footermenu
			if(e.length) {
				e[0].selectedIndex = controlVal;	// set menu index 
				e[0].onchange({target:e[0]});	// spoof the event, passing self (element) as target											
			}
		}	
	}
	
	else if(controlType == "checkbox") {
		// use actual value 0/1
		controlVal = parseInt( token[1] );  // 
		console.log("checkbox control value will be: " + controlVal );
	
		// now set the value 
	
		f = c.getElementsByTagName("footer");
		if(f.length) {						// if there is a footer
			g = f[0].getElementsByTagName("input");	// checkbox				
			if(g.length) {
				g[0].checked = controlVal;	// set checkbox value 
				g[0].onchange({target:g[0]});	// spoof the event, passing self (element) as target											
			}
		}	
	}		


}


