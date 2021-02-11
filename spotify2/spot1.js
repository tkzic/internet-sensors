// this is a test spot1.js

const maxapi = require('max-api');
var SpotifyWebApi = require('spotify-web-api-node');
var sleep = require('sleep-promise');


// globals

var playback_rate = 1;
var stop = true;
var play = false;
var pause = false;
var artist = "";
var song = "";	
var x;			// this will be pointer to analysis data

var need_to_request = true;
var got_analysis = false;

// set spotify credentials
var spotifyApi = new SpotifyWebApi({
  clientId: '5133662fa998058d00a',
  clientSecret: 'b16b3cfb7a7c45bb84',
  // redirectUri: 'http://www.example.com/callback'
});

// this version redirects console.log to maxapi.post

var console = {};
console.log = function (s) {
	maxapi.post(s);
}

maxapi.post('async2 script loaded');

// add handlers for incoming max messages

maxapi.addHandlers({
	
	artist: (artist_name) => {
		artist = artist_name;
		maxapi.post("artist: " + artist);
	},

	title: (title) => {
		song = title;
		maxapi.post("title: " + song);
	},

	analyze: () => {
		need_to_request = true;
		got_analysis = false;
		f().catch(console.log);  // get data from spotify api
		maxapi.post("processing spotify api data...");
	},
	
	rate: (rate) => {
		playback_rate = rate;
		maxapi.post("playback_rate: " + playback_rate);
	},

	hello: () => {
		maxapi.post('hello');
	},
	
	stop: () => {
		maxapi.post('stop');
		stop = true;
	  	play = false;
	  	pause = false;
	},
	
	pause: () => {
		maxapi.post('pause');
		if(pause) {		// if already paused
			music();	// then resume playing
		}
		else {
			stop = false;
		  	play = false;
		  	pause = true;	
		}
		
	},
	
	play: () => {
		maxapi.post('play');
		stop = false;
	  	play = true;
	  	pause = false;
		music();  // play something
	},
	
	
	
})

////////////// api functions ////////////////////////

// define an async function with 2 dependent promises
async function f() {  
	
	var i = 0;
	
// Retrieve an access token.
    let data = await spotifyApi.clientCredentialsGrant();
   	console.log('The access token expires in ' + data.body['expires_in']);
   	console.log('The access token is ' + data.body['access_token']);
 
   	// Save the access token so that it's used in future calls
   	spotifyApi.setAccessToken(data.body['access_token']);
	// search for track using artist + song name
	let data2 = await spotifyApi.searchTracks('track:' + song + ' artist:' + artist);
	let hitcount = data2.body.tracks.items.length; 
	console.log("\nnumber of items found: " + hitcount);
	let found = 0;	// search result
	for( i = 0; i < hitcount; i++) {
		if(data2.body.tracks.items[i].type == 'track') {
			found = true;
			let trackid = data2.body.tracks.items[i].id;
			break;
			
		}
		
	}
	if(found) {
		// console.log(data2.body);
		console.log("value of i: " + i);
		let p = data2.body.tracks.items[i];
		console.log("track name: " + p.name);
		console.log("artist: " + p.artists[0].name);
		console.log("item type: " + p.type);
		console.log("track id: " + p.id);	
	}
	else{
		// console.log("\nNo match on track and artist - try again");
		throw new Error("No match on track and artist - try again");
	}
	
	console.log("ready to get analysis for track...");
	// now get the analysis data
	let data3 = await spotifyApi.getAudioAnalysisForTrack(data2.body.tracks.items[i].id);
	//console.log(data3.body);	
	// jp = JSON.parse(data3.body);
	// console.log("hello...");
	x = data3.body;
	console.log("track duration: " + x.track.duration);
	console.log("sample rate: " + x.track.analysis_sample_rate);
    console.log("num segments: " + x.segments.length);
	console.log("segment 24 start: " + x.segments[24].start);
	
    need_to_request = false;
    got_analysis = true;
	
    // send global headers
	
	maxapi.outlet("key " + x.track.key);
	maxapi.post("key " + x.track.key)
	maxapi.outlet("mode " + x.track.mode);
	maxapi.post("mode " + x.track.mode);
	
	maxapi.post("analysis complete: ");
	
};


// process and play the analysis data

function music() {
	
	var i;	// segment index
	var j;	// inner index
	var seg;
	var msg = "";
	var sleep_time = 1000; // for calulating how long each segment plays
	
	(async () => {
		
		if(pause) {
			i = resume_index; // start where you left off
			pause = false;
		}
		else {
			i = 0;		// start with first segment
		}
		
		
		while(play) {
			
			if (i < x.segments.length) {
				
				maxapi.post( "segment-index: " + i);
				
				seg = x.segments[i];	// pointer to current segment	
        		// pitch
        		// make pitch message using all twelve pitch values
        		msg = "";
				for(j = 0; j < seg.pitches.length; j++) {
					msg = msg + seg.pitches[j] + " ";
				}
				
				maxapi.post("pitch " + msg);
				maxapi.outlet("pitch " + msg);
				
        		// timbre
        		
        		msg = "";
				for(j = 0; j < seg.timbre.length; j++) {
					msg = msg + seg.timbre[j] + " ";
				}
				maxapi.post("timbre " + msg);
				maxapi.outlet("timbre " + msg);
				
		        //  envelope 
		        //
				msg = "";
		        msg = msg + seg.start + " ";
		        msg = msg + seg.duration + " ";
		        msg = msg + seg.confidence + " ";
		        msg = msg + seg.loudness_start + " ";
		        msg = msg + seg.loudness_max_time + " ";
		        msg = msg + seg.loudness_max + " ";
		        if(i + 1 < x.segments.length) {
					msg = msg + x.segments[i + 1].loudness_start +  " ";
				}
		        else {
		        	msg = msg + "-72.0 ";
		        }
		        maxapi.post( "env " + msg);
		        maxapi.outlet("env " + msg);
				
     
				sleep_time = seg.duration;
				maxapi.post("segment duration: " + seg.duration);
				
			}		// end of segment loop block
	    	
			if(i >= x.segments.length) { // if we played all the way to the end
				play = false;
				stop = true;
				maxapi.post("playback complete");
				break;
			}
			
			// need to rething this - maybe break out and restart with current index value if paused?
			if(pause) {
				resume_index = i;
				break;
			}
			else {
				i++;	// do next segment
			} 
			
			if(stop) {
				i = 0;
				break;
			}
			
			sleep_time = (sleep_time / playback_rate) * 1000; // convert to milliseconds
			// console.log("sleep time will be: " + sleep_time);
			
			await sleep(sleep_time);  
	    	console.log(sleep_time + ' milliseconds later...');

			
		}  		// while (play)
	})();	// async container 
	
}


	
	
	




