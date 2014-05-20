// JSON-google-speech.js
//
// read results of google-speech api
// send 
//
outlets = 4;

var memstr;


// var speech = new Object();

function clear(){
	user = new Object();
    post("\ncleared");
}
// read sc user response json file
// 
function read(p) {
	
//	args = arrayfromargs(arguments);
//	post('args:', args, '\n');
	
	
	
	memstr = "";
	data = "";
	maxchars = 800;
	path = p;
	var f = new File(path,"read");
	f.open();
	if (f.isopen) {
		while(f.position<f.eof) {
			memstr+=f.readstring(maxchars);
		}
		f.close();
	} else {
		post("Error\n");
	}
	
	// fix output by removing first line 
	// pretty cool that Google speech produces malformed JSON...
	
	// break the textblock into an array of lines
	var lines = memstr.split('\n');
	// remove one line, starting at the first position
	lines.splice(0,1);
	// join the array back into a single string
	memstr = lines.join('\n');
	
	
	var	speech = JSON.parse(memstr);

	
	post("\nJSON Read",path);
	
// outlet the id and track_count
	


// changes for v2 of speech api

	outlet(0, "0" );	// not sure how to get the status thing yet...
	outlet(1, speech.result[0].alternative[0].transcript );
	outlet(2, speech.result[0].alternative[0].confidence );
	
	
}


