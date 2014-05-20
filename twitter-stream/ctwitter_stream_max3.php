<?
// ctwitter_stream_max3.php
//
// this is a version of the geo tweets streaming server that works with twitter api 1.1
// replacing twitterStreamMaxGeo.php
//
// Uses code from here: http://mikepultz.com/2013/06/mining-twitter-api-v1-1-streams-from-php-with-oauth/
//
// with a variation described in comments by Matt Walsh to above link which allows multiple fields
// like track, follow, locations, etc, 
//
// This code is called by ctwitter_example_max3.php which has the authorization credentials and
// search tags

// here are original notes from Mike Pultz
//
// A simple class to access the Twitter streaming API, with OAuth authentication
//
//	Mike (mike@mikepultz.com)
//
// Simple Example:
//
//	require 'ctwitter_stream.php';
//
//	$t = new ctwitter_stream();
//
//	$t->login('consumer_key', 'consumer secret', 'access token', 'access secret');
//
//	$t->start(array('facebook', 'fbook', 'fb'))
//

/////////////////////////////////////////////////////////////////
// here's all the max stuff which uses osc

include 'udp.php';		// udp data sending stuff

$DESTINATION = 'localhost';
$SENDPORT = '7400';
$RECVPORT = '7401';


	
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
	function osc_send_tweet($json)
	{
	    /*
	    echo "-----------------------------------------------------------\n";
	    echo $data;
	    echo "-----------------------------------------------------------\n";
	    */

		$maxdata = "/tweet" ;				// header - begin   
		global $kount;					// test counter
		global $osc;						// osc object


	    // $json = json_decode($data);
		
	
		// var_dump($json);
		// var_dump($json["user"]["screen_name"]);
		
	    if (isset($json["user"]) && isset($json["text"])) {
		
			// here we have a single tweet
	        echo "\n\nreceived tweet from:{$json['user']['screen_name']}: {$json['text']}\n\n";
	
			// do some cleaning up...
			// remove URL's
			$s = $json["text"];		// raw tweet text
			
			// $g = $json->geo->coords;
			
			// ok now need to do the same thing below for URL,s RT's @'s etc., 
			// and then remove redundant spaces	
			/* example
			Depending on how greedy you'd like to be, you could do something like:

			$pg_url = preg_replace("/[^a-zA-Z 0-9]+/", " ", $pg_url);
		
			This will replace anything that isn't a letter, number or space
			
			*/		
			
			// display all hashtags and their indices
			foreach( $json["entities"]["hashtags"] as $obj )
			{
			  echo "#:{$obj['text']}\n";		// display hashtag
			  // get rid of the hashtag
			 	// note: this gets rid of all hashtags, which could obscure the meaning of the tweet, if
				// the hashtag is used inside a sentence like: "my #cat is purple" - would be changed to: "my is purple"
				// so we could use some intelligent parsing here...
			
			
			//  $s = str_replace("#{$obj->text}", "", $s );
			
			// this is a more benign approach, which leaves the word but removes the #
			
			$s = str_replace("#{$obj['text']}", "{$obj['text']}", $s );
			
					
			}
			
			foreach( $json['entities']['urls'] as $obj )
			{
			  echo "U:{$obj['url']}\n";		// display url			
			  $s = str_replace("{$obj['url']}", "", $s );   // get rid of the url		
			}
			
			foreach( $json['entities']['user_mentions'] as $obj )
			{
				echo "@:{$obj['screen_name']}\n";		// display 			
				$s = str_replace("RT @{$obj['screen_name']}:", "", $s );   // get rid of re-tweets
				$s = str_replace("@{$obj['screen_name']}:", "", $s );   // get rid of other user mentions
				$s = str_replace("@{$obj['screen_name']}", "", $s );   // get rid of other user mentions		
			}
			
			
			// $s = str_replace("RT ", "", $s );   // get rid of RT's (re-tweet indicators)
			
			
			// $s = preg_replace( '/[^[:print:]]/', '',$s); // remove non printable characters
			
			$s = htmlspecialchars_decode($s);		// decode stuff like &gt;
			
			$s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x80-\x9F]/u', '', $s); // get rid of unicode junk
			
			$s = preg_replace('/[^(\x20-\x7F)]*/','', $s);		// get rid of other non printable stuff
			
			
			$s = preg_replace('!\s+!', ' ', $s);	// remove redundant white space
			
			echo "revised tweet: {$s}\n";
			
			// now get map coordinates
			
			$lat = $json['coordinates']['coordinates'][1];
			$lon = $json['coordinates']['coordinates'][0];
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

	    return ;
	}


//////////// here is the orignal code from Mike, with a hook into the max stuff


class ctwitter_stream
{
    private $m_oauth_consumer_key;
    private $m_oauth_consumer_secret;
    private $m_oauth_token;
    private $m_oauth_token_secret;

    private $m_oauth_nonce;
    private $m_oauth_signature;
    private $m_oauth_signature_method = 'HMAC-SHA1';
    private $m_oauth_timestamp;
    private $m_oauth_version = '1.0';

    public function __construct()
    {
        //
        // set a time limit to unlimited
        //
        set_time_limit(0);
    }

    //
    // set the login details
    //
    public function login($_consumer_key, $_consumer_secret, $_token, $_token_secret)
    {
        $this->m_oauth_consumer_key     = $_consumer_key;
        $this->m_oauth_consumer_secret  = $_consumer_secret;
        $this->m_oauth_token            = $_token;
        $this->m_oauth_token_secret     = $_token_secret;

        //
        // generate a nonce; we're just using a random md5() hash here.
        //
        $this->m_oauth_nonce = md5(mt_rand());

        return true;
    }

    //
	// ********** this is the mod for max/msp ****************
    // process a tweet object from the stream
    //
    //	private function process_tweet(array $_data)  // tz: 3/2104 this declaration caused runtime type error
	private function process_tweet($_data)
    {

//        print_r($_data);

		osc_send_tweet( $_data );

        return true;
    }

	//************ end of max mod

    //
    // the main stream manager
    //
	public function start($_keywords = array(), $_coordinates = array(), $count = 0)
	{
		
		// $data = array();
			
		if(!is_array($_keywords))
			{
			$_keywords = array();
			}

		if(!is_array($_coordinates))
			{
			$_coordinates = array();
			}

		while(1)
		{
			$fp = fsockopen("ssl://stream.twitter.com", 443, $errno, $errstr, 30);
            if (!$fp)
            {
                echo "ERROR: Twitter Stream Error: failed to open socket";
            } else
            {
				//
				// build the data and store it so we can get a length
				//

				$track = "";
				$locations = "";
				$request_data = "";

				if(count($_coordinates) > 0)
				{
					$locations = 'locations=' . rawurlencode(implode(",", $_coordinates));
					$request_data .= $locations;
				}

				if(count($_keywords) > 0)
				{
					if(count($_coordinates))
					{
						$request_data .= "&";
					}

					$track = 'track=' . rawurlencode(implode(",", $_keywords));
					$request_data .= $track;
				}
				
				echo 'REQUEST DATA:' . $request_data . "\n";

				//
				// store the current timestamp
				//
				$this->m_oauth_timestamp = time();

				//
				// generate the base string based on all the data
				//
				$base_string = 'POST&' . rawurlencode('https://stream.twitter.com/1.1/statuses/filter.json'). '&';

				if(strlen($locations))
				{
					$base_string .= rawurlencode($locations . '&');
				}

				$base_string .= rawurlencode('oauth_consumer_key=' . $this->m_oauth_consumer_key . '&' .
				'oauth_nonce=' . $this->m_oauth_nonce . '&' .
				'oauth_signature_method=' . $this->m_oauth_signature_method . '&' .
				'oauth_timestamp=' . $this->m_oauth_timestamp . '&' .
				'oauth_token=' . $this->m_oauth_token . '&' .
				'oauth_version=' . $this->m_oauth_version);

				if(strlen($track))
				{
					$base_string .= rawurlencode('&' . $track);
				}

				//
				// generate the secret key to use to hash
				//
				$secret = rawurlencode($this->m_oauth_consumer_secret) . '&' .
				rawurlencode($this->m_oauth_token_secret);

				//
				// generate the signature using HMAC-SHA1
				//
				// hash_hmac() requires PHP >= 5.1.2 or PECL hash >= 1.1
				//
				$raw_hash = hash_hmac('sha1', $base_string, $secret, true);

				//
				// base64 then urlencode the raw hash
				//
				$this->m_oauth_signature = rawurlencode(base64_encode($raw_hash));

				//
                // build the OAuth Authorization header
                //
                $oauth = 'OAuth oauth_consumer_key="' . $this->m_oauth_consumer_key . '", ' .
                        'oauth_nonce="' . $this->m_oauth_nonce . '", ' .
                        'oauth_signature="' . $this->m_oauth_signature . '", ' .
                        'oauth_signature_method="' . $this->m_oauth_signature_method . '", ' .
                        'oauth_timestamp="' . $this->m_oauth_timestamp . '", ' .
                        'oauth_token="' . $this->m_oauth_token . '", ' .
                        'oauth_version="' . $this->m_oauth_version . '"';

					  //
		                // build the request
		                //
		                $request  = "POST /1.1/statuses/filter.json HTTP/1.1\r\n";
		                $request .= "Host: stream.twitter.com\r\n";
		                $request .= "Authorization: " . $oauth . "\r\n";
		                $request .= "Content-Length: " . strlen($request_data) . "\r\n";
		                $request .= "Content-Type: application/x-www-form-urlencoded\r\n\r\n";
		                $request .= $request_data;

				//
				// write the request
				//
				fwrite($fp, $request);

				//
				// set it to non-blocking
				//
				stream_set_blocking($fp, 0);

				while(!feof($fp))
				{
					$read = array($fp);
					$write = null;
					$except = null;

					//
					// select, waiting up to 10 minutes for a tweet; if we don’t get one, then
					// then reconnect, because it’s possible something went wrong.
					//
					$res = stream_select($read, $write, $except, 600, 0);
					if ( ($res == false) || ($res == 0) )
					{
						break;
					}

					//
					// read the JSON object from the socket
					//
					$json = fgets($fp);

					//
					// look for a HTTP response code
					//
					if (strncmp($json, 'HTTP/1.1', 8) == 0)
					{
						$json = trim($json);
						if ($json != 'HTTP/1.1 200 OK')
						{
							echo 'ERROR: ' . $json . "\n";
							return false;
						}
					}

					//
					// if there is some data, then process it
					//
					if ( ($json !== false) && (strlen($json) > 0) )
					{
						//
						// decode the socket to a PHP array
						//
						$data = json_decode($json, true);
						if ($data)
						{
							//
							// process it
							//
							$this->process_tweet($data);
						}
					}
				}
			}

			fclose($fp);
			sleep(10);
		}

		return;
	}
};

?>