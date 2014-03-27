

// get rid of html tags

inlets = 1;
outlets = 1;

var rmode = 1;	// 0: normal ascii, 1: rtty

function clean(a) 
{
	var cleanText = a.replace(/<\/?[^>]+(>|$)/g, "");
	
	outlet(0, cleanText );
}

