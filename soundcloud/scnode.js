// scnode.js - Max engine for soundcloud api

const maxapi = require('max-api');

// this version redirects console.log to maxapi.post

var console = {};
console.log = function (s) {
	maxapi.post(s);
}

maxapi.post('scnode.js script loaded');


const SoundCloud = require('soundcloud-api-client');

const client_id = 'ec6eaa3e8f95b35314';
const soundcloud = new SoundCloud({ client_id });

// typical params block. 
//const params = {
//    q: 'recorded live at',
//    genres: [ 'house', 'tech-house', 'techno' ].join(','),
//    'bpm[from]': 125,
//    'bpm[to]': 130,
//    'duration[from]': 1800000
//};

// we'll only be using the q (query) field for this application
const params = {
    q: 'recorded live at'
};


// console.log ("params: " + JSON.stringify(params) );

///////////////////////

// more globals


var id = "";
var user = "";
var title = "";
var permalink = "";
var stream_url = "";

var filename = "/tmp/sc.mp3";




// add handlers for incoming max messages

maxapi.addHandlers({
	



	hello: () => {
		maxapi.post('hello');

		
		
	},
	
	download: (d_url) => {
		maxapi.post('download: ' + d_url);
		// maxapi.post('downloading track: ' + id + ' ' + user + ' ' + title + ' ' + permalink + ' ' + stream_url);
		
		
	    // console.log(`Downloading track ${username} – ${title} (#${id}) to "${filename}"...`);

	    soundcloud.download(d_url, filename)
		.then(() => {
				console.log('download Done!');
				maxapi.outlet('play');
		})
	        .catch(({ message }) => console.error('download Saving failed: ' + message));
		
		

	},
	
	search: (query_string) => {
		maxapi.post('search: ' + query_string);
		params.q = query_string;
		console.log('Searching for tracks with following params: ' + JSON.stringify(params));

		soundcloud.get('/tracks', params).then(tracks => {
		    console.log(`Found ${tracks.length} tracks:\n`);
			// console.log(tracks);
		    tracks.forEach(({ user, title }) => console.log(`* ${user.username} – ${title}`));
			
			// save first track for download
			let t = tracks[0];
			id = t.id;
			user = t.user.username;
			title = t.title;
			permalink = t.permalink;
			stream_url = t.stream_url;
			
			// outlet track list to max
			var i;
			for (i = 0; i < tracks.length ; i++) {
				maxapi.outlet('tracks ' + tracks[i].title +  ' ' + tracks[i].user.username);
				maxapi.outlet('urls ' + tracks[i].stream_url);
			}
			
			
			
		}).catch(e => console.error('An error occurred: ' + e.message));
		
	
		
	},
	
	
	
})

