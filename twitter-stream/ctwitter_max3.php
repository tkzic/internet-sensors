<?

// ctwitter_max3.php
// 
// this code replaces twitterStreamMaxGeo.php for the Twitter v1.1 API requiring Oauth
//
// You will need to create a Twitter App from your account and replace the fields below with 
// your: consumer key, consumer secret, access token, and access secret - strings
//
// A simple class to access the Twitter streaming API, with OAuth authentication
//
//	Mike (mike@mikepultz.com)
//
// Simple Example:
//
	require 'ctwitter_stream_max3.php';
//
	$t = new ctwitter_stream();
//
	$t->login('ZdzfNxV34jhQlNFy8OHeOA', 'eXzUOf778AqU8hAhpRbCTnnSN0T7neYtg8dIWDC7j3bs', '205589709-5kRI1fllJvU34v3xZhRlwYV9OSn9LrTajtxSrvO8', 'u5MuSxPseBemU89WlMxEFawYwjlkFL8XA0eHlReCnQ');
	
//	$t->login('consumer_key', 'consumer secret', 'access token', 'access secret');
//
//	$t->start(array('facebook', 'fbook', 'fb'), array() );  // search for 'facebook' 
	$t->start(array(), array('-180','-90','180','90') );	// search entire world for geo-coded tweets


?>