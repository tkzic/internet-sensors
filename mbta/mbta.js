// get current location of buses on MBTA 01 route 
// (ie., Harvard Sq. to Dudley Sq. on Mass Ave.)

outlets = 3;
numstops = 24; // total number of stops on the route

var stops;	// global to hold stops lists response data

// run get request to MBTA API
function get(url)  
{
	var ajaxreq = new XMLHttpRequest();
	ajaxreq.open("GET", url);
	ajaxreq.onreadystatechange = readystatechange;
	ajaxreq.send();
}

// run get request to get data for stops on a route 
function getstops(route)  
{
	
	// hard coded to route 1 for now
	var url = 'https://api-v3.mbta.com/stops?filter[route]=1';
	var ajaxreq = new XMLHttpRequest();
	ajaxreq.open("GET", url);
	ajaxreq.onreadystatechange = stops_readystatechange;
	ajaxreq.send();
}

// process stops for given route
function stops_readystatechange() {

	var rawtext = this._getResponseKey("body");
	stops = JSON.parse(rawtext);	// store all the data in a global for later search

	var i;
	var v;
	var p;
	
	
	for( i = 0 ; i < stops.data.length ; i++ ) {
		p = stops.data[i];
		post('\nstop id: '  + p.id + ', stop name: ' + p.attributes.name );
	}
	
}

// search for stop name by id
function searchstops(id) {
	
	var i;
	var sid = id.toString();  // just making sure the types are the same
	var result = "not found";
	// post('\nsearching for: ' + id);
	
	
	for( i = 0 ; i < stops.data.length ; i++ ) {
		if(sid === stops.data[i].id) {
			result = stops.data[i].attributes.name + ', ' + stops.data[i].attributes.municipality
			 ;
			break;
		}
		
	}
	 
	outlet(1, result );
	
}



// process JSON response data from API
function readystatechange()
{
	var i, j;
	var vehicle = "";	// this will be the output string
	
	var rawtext = this._getResponseKey("body");
	var body = JSON.parse(rawtext);
	var v;
	var p;
	var stop = 0;	// current stop number
	var stopid = "";
	var result = ""; // for stop name lookup
	
    // post(rawtext);
    // return;
// mbta vehicle information for a specific route, like harvard to dudley
//	
	
	for(i = 0 ; i < body.data.length; i++ ) {
		v = i + 1; // col index
		p = body.data[i].attributes;
		post('\n');
		post('\nbus id: ' + body.data[i].id);
		if(body.data[i].relationships.stop.data != null) {
			stopid = body.data[i].relationships.stop.data.id;
						
		}
		else {
			stopid = 'null';
		}
		post('\nstop id: ' + stopid);
		post('\nbearing: ' + p.bearing);
		post('\nstatus: ' + p.current_status);
		post('\ndirection_id: ', p.direction_id);
		post('\ncurrent_stop_sequence: ' + p.current_stop_sequence);
		post('\nlatitude: ' + p.latitude);
		post('\nlongitude: ' + p.longitude);
		// flip the sequence number if direction_id is 1
		if(parseInt(p.direction_id) == 1) {
			stop = numstops - parseInt(p.current_stop_sequence);
		}
		else {
			stop = parseInt(p.current_stop_sequence);
		}
		// stop = parseInt(p.current_stop_sequence);
		// now search for actual name of current bus stop
		result = "NA"; // default
		for( j = 0 ; j < stops.data.length ; j++ ) {
			if(stopid === stops.data[j].id) {
				result = stops.data[j].attributes.name + ' - ' + stops.data[j].attributes.municipality
				 ;
				break;
			}
		
		}	
		// kluge for nubian station bug
		if(stopid === "64") {
			result = "Nubian - Boston";
		}	
		
		vehicle = v + ' ' + v + ' ' + p.latitude + ' ' + p.longitude + ' ' + stop + ' ' + p.direction_id + ' ' + stopid + ' ' +  body.data[i].id + ' ' + result ; // for col
		post("\nvehicle: ", vehicle, '\n');
		outlet(0, vehicle );		// send vehicle position to max
		}	
		
		// data format:
		// col index
		// bus index
		// lat
		// lon
		// stop sequence
		// direction id
		// stop id
		// bus id
		// stop name and city
		
		
		
		
		
		outlet(2, 'done'); // data is ready	
}



