$(document).ready(function() {
  $("#map").css({
		height: 500,
		width: 600
	});
	// var myLatLng = new google.maps.LatLng(17.74033553, 83.25067267);
	var myLatLng = new google.maps.LatLng(44.404202, -70.790604); // changed to bethel, Maine
  MYMAP.init('#map', myLatLng, 11);
  
  $("#showmarkers").click(function(e){
		MYMAP.placeMarkers('markers.xml');
  });
$("#connectOSC").click(function(e){
		connectOSC();
  });

});

var MYMAP = {
  map: null,
	bounds: null
}

MYMAP.init = function(selector, latLng, zoom) {
  var myOptions = {
    zoom:zoom,
    center: latLng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  this.map = new google.maps.Map($(selector)[0], myOptions);
	this.bounds = new google.maps.LatLngBounds();
}

MYMAP.placeMarkers = function(filename) {
	$.get(filename, function(xml){
		$(xml).find("marker").each(function(){
			var name = $(this).find('name').text();
			var address = $(this).find('address').text();
			
			// create a new LatLng point for the marker
			var lat = $(this).find('lat').text();
			var lng = $(this).find('lng').text();
			var point = new google.maps.LatLng(parseFloat(lat),parseFloat(lng));
			
			// extend the bounds to include the new point
			MYMAP.bounds.extend(point);
			
			var marker = new google.maps.Marker({
				position: point,
				map: MYMAP.map
			});
			
			var infoWindow = new google.maps.InfoWindow();
			var html='<strong>'+name+'</strong.><br />'+address;
			google.maps.event.addListener(marker, 'click', function() {
				infoWindow.setContent(html);
				infoWindow.open(MYMAP.map, marker);
			});
			MYMAP.map.fitBounds(MYMAP.bounds);
		});
	});
}


function tzPlaceMarkers(lat, lon) {

			
			// create a new LatLng point for the marker
	
			var point = new google.maps.LatLng(lat,lon);
			
			// extend the bounds to include the new point
			MYMAP.bounds.extend(point);
			
			var marker = new google.maps.Marker({
				position: point,
				map: MYMAP.map
			});
			
			var infoWindow = new google.maps.InfoWindow();
			var html='<strong>'+ "zic" +'</strong.><br />'+ "mason street";
			google.maps.event.addListener(marker, 'click', function() {
				infoWindow.setContent(html);
				infoWindow.open(MYMAP.map, marker);
			});
			MYMAP.map.fitBounds(MYMAP.bounds);
		

}

// this is the stuff i added for web sockets
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// var ip = '69.49.153.74';
// var ip = '192.168.1.104';
var ip = 'localhost';
var port = '1234';

var globalLat, globalLon;	// temp vars for testing

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
	
	tzPlaceMarkers(lat, lon)
	
	return;
	
}	
	
	


