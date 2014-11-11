// get current location of buses on 01 route

function get(url)
{
	var ajaxreq = new XMLHttpRequest();
	ajaxreq.open("GET", url);
	ajaxreq.onreadystatechange = readystatechange;
	ajaxreq.send();
}

function readystatechange()
{
	var i, j;
	var vehicle = "";	// this will be the output string
	
	var rawtext = this._getResponseKey("body");
	var body = JSON.parse(rawtext);

// mbta vehicle information for a specific route, like harvard to dudley
//	
	v = 1;		// vehicle index for Max coll object
	for(i = 0 ; i < body.direction.length; i++ ) {
		post('direction: ', body.direction[i].direction_name, '\n');
		for( j= 0 ; j < body.direction[i].trip.length ; j++ ) {
			post('    trip: ', body.direction[i].trip[j].trip_headsign, '\n');
			post('        vehicle_id: ', body.direction[i].trip[j].vehicle.vehicle_id, "\n");
			post('        vehicle_lat: ', body.direction[i].trip[j].vehicle.vehicle_lat, "\n");
			post('        vehicle_lon: ', body.direction[i].trip[j].vehicle.vehicle_lon, "\n");
			post('        vehicle_timestamp: ', body.direction[i].trip[j].vehicle.vehicle_timestamp, "\n");
			
			vehicle = v + ' ' + v + ' ' + body.direction[i].trip[j].vehicle.vehicle_lat + ' ' + body.direction[i].trip[j].vehicle.vehicle_lon;
			post("vehicle: ", vehicle, '\n');
			outlet(0, vehicle );
			v++;
			}
		}	
		
		
}