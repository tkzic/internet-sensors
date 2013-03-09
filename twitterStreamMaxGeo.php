<?php

// max-osc-play.php
//
//	collection of php OSC code from Max stock-market thing
//


include 'udp.php';		// udp data sending stuff

$DESTINATION = 'localhost';
$SENDPORT = '7400';
$RECVPORT = '7401';


//////////////////////////////////////////////////////////////////////////////////////////
//
//  replace these with your Twitter account username and password
//
	$USERNAME = 'myTwitterUsername';
	$PASSWORD = 'myTwitterPassword';
	
	$TIMEOUT = 20;			// runtime in seconds. You'll get about 1000 tweets in 20 seconds
	
	// query not used in this version
	$QUERY    = '#cats';		// the hashtag # is optional 
	
	// these variables are defined as global so they can be used inside the write callback function
	global $osc;
	global $kount;
	
	// initialize OSC
	$osc = new OSCClient();  // OSC object
	$osc->set_destination($DESTINATION, $SENDPORT);
	

	// This amazing program uses curl to access the Twitter streaming API and breaks the data
	// into individual tweets which can be saved in a database, sent out via OSC, or whatever
	//

		
	// functions to convert lat lon to x y, etc from http://wiki.openstreetmap.org/wiki/Mercator
	// not used in this version
	
	function lon2x($lon) { return deg2rad($lon) * 6378137.0; }
	function lat2y($lat) { return log(tan(M_PI_4 + deg2rad($lat) / 2.0)) * 6378137.0; }
	function x2lon($x) { return rad2deg($x / 6378137.0); }
	function y2lat($y) { return rad2deg(2.0 * atan(exp($y / 6378137.0)) - M_PI_2); }
	
	
	
	
	/**
	 * Called every time a chunk of data is read, this will be a json encoded message
	 * 
	 * @param resource $handle The curl handle
	 * @param string   $data   The data chunk (json message)
	 */
	function writeCallback($handle, $data)
	{
	    /*
	    echo "-----------------------------------------------------------\n";
	    echo $data;
	    echo "-----------------------------------------------------------\n";
	    */

		$maxdata = "/tweet" ;				// header - begin   
		global $kount;					// test counter
		global $osc;						// osc object

	    $json = json_decode($data);
	    if (isset($json->user) && isset($json->text)) {
		
			// here we have a single tweet
	        echo "@{$json->user->screen_name}: {$json->text}\n\n";
	
			// do some cleaning up...
			// remove URL's
			$s = $json->text;		// raw tweet text
			
			// $g = $json->geo->coords;
			
			// ok now need to do the same thing below for URL,s RT's @'s etc., 
			// and then remove redundant spaces	
			/* example
			Depending on how greedy you'd like to be, you could do something like:

			$pg_url = preg_replace("/[^a-zA-Z 0-9]+/", " ", $pg_url);
		
			This will replace anything that isn't a letter, number or space
			
			*/		
			
			// display all hashtags and their indices
			foreach( $json->entities->hashtags as $obj )
			{
			  echo "#:{$obj->text}\n";		// display hashtag
			  // get rid of the hashtag
			 	// note: this gets rid of all hashtags, which could obscure the meaning of the tweet, if
				// the hashtag is used inside a sentence like: "my #cat is purple" - would be changed to: "my is purple"
				// so we could use some intelligent parsing here...
			
			
			//  $s = str_replace("#{$obj->text}", "", $s );
			
			// this is a more benign approach, which leaves the word but removes the #
			
			$s = str_replace("#{$obj->text}", "{$obj->text}", $s );
			
					
			}
			
			foreach( $json->entities->urls as $obj )
			{
			  echo "U:{$obj->url}\n";		// display url			
			  $s = str_replace("{$obj->url}", "", $s );   // get rid of the url		
			}
			
			foreach( $json->entities->user_mentions as $obj )
			{
				echo "@:{$obj->screen_name}\n";		// display 			
				$s = str_replace("RT @{$obj->screen_name}:", "", $s );   // get rid of re-tweets
				$s = str_replace("@{$obj->screen_name}:", "", $s );   // get rid of other user mentions
				$s = str_replace("@{$obj->screen_name}", "", $s );   // get rid of other user mentions		
			}
			
			
			// $s = str_replace("RT ", "", $s );   // get rid of RT's (re-tweet indicators)
			
			
			// $s = preg_replace( '/[^[:print:]]/', '',$s); // remove non printable characters
			
			$s = htmlspecialchars_decode($s);		// decode stuff like &gt;
			
			$s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x80-\x9F]/u', '', $s); // get rid of unicode junk
			
			$s = preg_replace('/[^(\x20-\x7F)]*/','', $s);		// get rid of other non printable stuff
			
			
			$s = preg_replace('!\s+!', ' ', $s);	// remove redundant white space
			
			echo "revised tweet: {$s}\n";
			
			// now get geo coordinates
			
			$lat = $json->geo->coordinates[0];
			$lon = $json->geo->coordinates[1];
			echo "lat: {$lat}, lon: {$lon}\n";
			
			// $x = lat2x($lat);
			// $y = lon2y($lon);
			
			
			// this is mercator stuff - not going to bother with it for now
		
			/*
			$y = deg2rad($lon) * 6378137.0; 
			$x = log(tan(M_PI_4 + deg2rad($lat) / 2.0)) * 6378137.0; 
			
			echo "x: {$x}, y: {$y}";
			*/
			
			// this is pixel rule of thumb stuff
			
			$px = round (1000*($lon + 180)/360);
			$py = round (500 - 500*($lat + 90)/180);
	
			echo "px: {$px}, py: {$py}";
	
			$maxdata = "/tweet {$px} {$py} {$s}";
			// $maxdata = $maxdata . " " . $kount++;
		   	$osc->send(new OSCMessage($maxdata));
	
	
	    }

	    return strlen($data);
	}


// initialize curl

	$ch = curl_init();
	
	// note that when you combine tracking query and locations, the API treats it as an OR condition
	// so you get tweets that either match the query or are geotagged
	// there is no way to do an and condition other than to write your own filter on the results

	// $data = "track=" . urlencode($QUERY) . "&locations=-180,-90,180,90";
	$data = "locations=" . urlencode("-180,-90,180,90");		// get the whole world
	curl_setopt($ch, CURLOPT_URL, 'https://stream.twitter.com/1/statuses/filter.json');
	curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
	curl_setopt($ch, CURLOPT_USERPWD, "$USERNAME:$PASSWORD");
	curl_setopt($ch, CURLOPT_WRITEFUNCTION, 'writeCallback');
	curl_setopt($ch, CURLOPT_TIMEOUT, $TIMEOUT ); // disconnect after 20 seconds for testing
	curl_setopt($ch, CURLOPT_VERBOSE, 1);  // debugging
	curl_setopt($ch, CURLOPT_ENCODING,  'gzip, deflate'); // req'd to get gzip
	curl_setopt($ch, CURLOPT_USERAGENT, 'tstreamer/1.0'); // req'd to get gzip

	curl_exec($ch); // commence streaming

	$info = curl_getinfo($ch);

	var_dump($info);


?>
