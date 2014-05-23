<?php

// play2.php
//
//	retrieve quotes from table, analyze, and create messages for max/msp
//


include 'udp.php';		// udp data sending stuff

////////////////////////////////////////////////////////////////

function tickmatch($t , $ttc )	// return index matching ticker in tc array
{

	
	for($m = 0; $m < count($ttc); $m++ )
		{
		if( strtoupper($ttc[$m]->ticker) == strtoupper($t) )
			return($m);
		}
		
	return(-1);  // error
	
}



////////////////////////////////////////////////////////////////////////////////////////////////////
function playnotes( $mn , $ip)
{


// this is a total hack way of sending data to max
//
// since i couldn't write anything in php which would receive udp data, this uses the nc (netcat) command inside the
// doalarm command which provides timeout capability - unfortunately, none of the php stream timeout methods worked on nc either
//

// error_reporting(E_ALL);


// timeout is set to 10 seconds

 $fp = popen('./doalarm 10 nc -l -u 7401 2>&1', "r");   // note that command is opened with redirection of stderr


if (!$fp)
	{
 	exit( "error: unable to run netcat" );
   	} 







//  now send data to max

   $c = new OSCClient();
   
// should check for error here too

   $c->set_destination( $ip, 7400);
   
   
// eventually, this data will be sent as JSON  

	// This is probably not necessary here - but send a stop message to stop any currently playing sequence 

	$maxdata = "/stop" ;				  
   	$c->send(new OSCMessage($maxdata));
   

	$maxdata = "/begin" ;				// header - begin   
   	$c->send(new OSCMessage($maxdata));

   for($i = 0; $i < count($mn); $i++ )	// send note events (sorted by eventtime)
   		{
		$maxdata = "/play " . " " . $mn[$i]->eventtime . " "  . $mn[$i]->note 
			. " " . $mn[$i]->velocity  . " " . $mn[$i]->duration . " " . $mn[$i]->channel . " " . $mn[$i]->delay ;
	    $c->send(new OSCMessage($maxdata));
		}
		
	$maxdata = "/end" ;				// header - end   
	$c->send(new OSCMessage($maxdata));
	

// get response from max
   
	sleep(1);
	  
	$res = fread($fp, 2000);
   pclose($fp);
   
// here we could actually check for elapsed time of 4 seconds to confirm timeout error
   
   
	
	if($res == NULL)
		echo "error -  no response from max/msp server" ;
	else
	    echo "max returned: " . $res;
	
	echo "<br>";

}

//////////////////////////////////////////////////////////
// sort maxnote array
///////////////////////////////////////////////////////////
function cmp($a, $b)
{
  if ($a->eventtime == $b->eventtime)
    {
    return 0;
    }
  else if ($a->eventtime < $b->eventtime)
  	 {
  	 return(-1);
  	 }
  else
     {
     return(1);
     }	
  
}


//////////////////////////////////////////////////////
//	objects and global variables
/////////////////////////////////////////////////////////

// 	value object for music calculations

class transcode
	{
	var	$ticker;		// stock symbol
	var $pmin;
	var $pmax;		// price min/max
	var $vmin;		// volume min/max
	var $vmax;
	var $tcount;	// total number of records
	var $avi;		// average volume interval
	var $cpn;		// cost per note
	var $prevol;	// previous volume (used in calculating volume intervals)
	var $eventtime;	// actual time of event from beginning of song, in milliseconds
	var $prevtime;	// previous time - used in weeding out duplicate records
	}
	
	
// 	value object for max note messages

class maxnote
	{
	var	$channel;		// 
	var $note;
	var $velocity;		// 
	var $duration;			// 
	var $eventtime;
	var $delay;
	}
	
	

// define value object for quote structure

class quote {
  var $ticker, $price, $qdate, $qtime, $change, $open, $high, $low, $volume, $ttime, $id, $spare;
}


$highnote = 115;		// highest note to play

$globalmaxip = "192.168.1.119";

////////////////////////////////////////////////////////////////////////////////	
///////////////////////////////////////////////////////////////////////////////
//
//
// 						this is the main entry point
//
//////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// check for input: q=ticker, qstartdate=date, qstarttime=time, qenddate=date, qendtime=time + random number to defeat caching
//
// nominal error checking for blank fields, but we're assuming that input checking will be done on client side
//
//

// echo "hello from play3.php...";

if( $_GET['q'] == '' )
		exit("need stock ticker symbol to play");	

// get IP address of Max patch computer

	$globalmaxip = $_GET['maxip'];
	
//   echo "setting max ip address to:" . $globalmaxip;

// get dates and times for where clause
	
	$startdate = $_GET['qstartdate'];
	$enddate = $_GET['qenddate'];
	$starttime = $_GET['qstarttime'];
	$endtime = $_GET['qendtime'];

	
	if( $startdate == '' )
		exit("missing startdate");	
	if( $starttime == '' )
		exit("missing starttime");	
	if( $enddate == '' )
		exit("missing enddate");
	if( $endtime == '' )
		exit("missing endtime");	

// split out the ticker symbols

$qarray = preg_split("/[\s,]+/", $_GET['q'] );
$qnum = count( $qarray );


// print_r ($qarray );
// print_r ($qnum );



// make an array of transcode objects for each ticker symbol

	$tc = array(new transcode);
	for($i = 0 ; $i < ($qnum - 1); $i++ )
		array_push($tc, new transcode );


// $tc[0]->ticker = 'goo';	// test data
// $tc[1]->ticker = 'hoo'; // more test data

// print_r( $tc);	// display the array of structs (classes)

///////////////////////////////////////////////////////////////////////////////////

// open stocks database


$con = mysql_connect('localhost', 'webdb1', '34door');
if (!$con)
 {
 die('Could not connect: ' . mysql_error());
 }

mysql_select_db("stocks", $con);



// This query gives the overall picture of what, if any, data exists for the selected ticker and date
//
// from the result we can decide whether to continue, ie, are there any records at all?
//
// and we can assign values to the factors which will be used to generate musical sounds


// build ticker part of where clause - assuming we have at least one ticker if we've made it this far
	
	
	$iwc = "";
	
	for($i = 0; $i < $qnum; $i++ )
		{
		if( $i > 0 )			// delimit tickers with commas
			$iwc = $iwc . ",";
		$iwc = $iwc . "'" . $qarray[$i] . "'";
		}
		
		
//	echo "ticker where clause: " . $iwc;
//	exit();
	
// build date-time part of where clause

	$dd = date_parse( $startdate );
	$tt = date_parse( $starttime );
 	$sdwc = "'" . $dd['year'] . "-" . $dd['month'] . "-" . $dd['day'] . " " . $tt['hour'] . ":" . $tt['minute'] . "'" ;	 // start date-time (usually market open)
 	$dd = date_parse( $enddate );
	$tt = date_parse( $endtime );
	$edwc = "'" . $dd['year'] . "-" . $dd['month'] . "-" . $dd['day'] .  " " . $tt['hour'] . ":" . $tt['minute'] . "'" ;	// end date-time (usually market close)
		

// assemble query

   $sql = "SELECT ticker, min(price) AS pmin, max(price) AS pmax,   min(volume) AS vmin, max(volume) AS vmax, 
   				count(ticker) as tcount  
           FROM quotes 
           WHERE ticker IN (" . $iwc . ") AND qtime >= " . $sdwc . " AND qtime <= " . $edwc . 
           " GROUP BY ticker";


//	echo "sql string: " . $sql;
//	exit();
				
$result = mysql_query($sql);
if(!$result)
	{
	die('query error: ' . mysql_error());
    }


echo "all set" ;


echo "<table border='1'>
<tr>
<th>ticker</th>
<th>pmin</th>
<th>pmax</th>
<th>vmin</th>
<th>vmax</th>
<th>tcount</th>
<th>avi</th>
<th>cpn</th>
</tr>";

$msgcount = 0;	// this will be the number of messages sent to max
$rc = 0;			// count number of rows retrieved
while($row = mysql_fetch_array($result))
 {
 
 $tc[$rc]->ticker = $row['ticker'];
 $tc[$rc]->pmin =  $row['pmin'];
 $tc[$rc]->pmax = $row['pmax'];
 $tc[$rc]->vmin = $row['vmin'];
 $tc[$rc]->vmax = $row['vmax'];
 $tc[$rc]->tcount = $row['tcount'];
 $tc[$rc]->avi = floor(($tc[$rc]->vmax - $tc[$rc]->vmin) / $tc[$rc]->tcount);   // calculate average volume invterval 
 if($tc[$rc]->pmax == $tc[$rc]->pmin)											// if there is no difference between high and low price
 	$pfac = 0.01;																// set arbitrary value of $.01 to prevent div by zero warning
 else
 	$pfac = $tc[$rc]->pmax - $tc[$rc]->pmin;
 $tc[$rc]->cpn = $highnote / $pfac;											// calculate cost per note
 $tc[$rc]->prevol = $tc[$rc]->vmin - $tc[$rc]->avi;							// set initial volume to vol_minimum - avg_interval
 $tc[$rc]->prevtime = "10-31-1955 13:31";								// set initial date-time to an impossible value
 $tc[$rc]->eventtime = 0;												// start events at 0 
 $msgcount += $tc[$rc]->tcount;
 
 echo "<tr>";
 echo "<td>" . $row['ticker'] . "</td>";
 echo "<td>" . $row['pmin'] . "</td>";
 echo "<td>" . $row['pmax'] . "</td>";
 echo "<td>" . $row['vmin'] . "</td>";
 echo "<td>" . $row['vmax'] . "</td>";
 echo "<td>" . $row['tcount'] . "</td>";
 echo "<td>" . $tc[$rc]->avi . "</td>";
 echo "<td>" . $tc[$rc]->cpn . "</td>";

 echo "</tr>";
  $rc++;

 }
echo "</table>";


// bail if there's nothing in the database  - 

if ($rc == 0 )
	{
	echo "error: no data available for: " . $iwc . " on " . $startdate ;
	exit();
	}
	
/////////////////////////////////////////////////////////////

// make an array of messages to send to max

	$mn = array(new maxnote);
	for($i = 0 ; $i < ($msgcount - 1); $i++ )
		array_push($mn, new maxnote );



///////////////////////////////////////////////////////////////////////


// retrieve all quotes for selected ticker and date



   $sql = "SELECT ticker, price, volume, qtime  
           FROM quotes 
           WHERE ticker IN (" . $iwc .  ") AND qtime >= " . $sdwc . " AND qtime <= " . $edwc . 
           " ORDER BY qtime, ticker";

				
$result = mysql_query($sql);
if(!$result)
	{
	die('query error: ' . mysql_error());
    }


echo "all set" ;


echo "<table border='1'>
<tr>
<th>ticker</th>
<th>price</th>
<th>volume</th>
<th>time</th>
<th>channel</th>
<th>note</th>
<th>velocity</th>
<th>duration</th>
<th>eventtime</th>
</tr>";

// here is where we calculate the note values  - assuming there is more than one record or we would have bailed earlier


$n = 0;			// record counter
while($row = mysql_fetch_array($result))
 {
 
 
 $i = tickmatch($row['ticker'], $tc);								// index into tc array
 
 if($row['qtime'] != $tc[$i]->prevtime)								// skip records with duplicate quote time - they cause weird delays
	 { 
	 $note = floor(($row['price'] - $tc[$i]->pmin) * $tc[$i]->cpn);		// note
	 $chg = $row['volume'] - $tc[$i]->prevol; 							// change in volume since previous record
	 if($chg == 0) $chg = 1;											// prevent div by 0 error
	 $velocity = floor(((($chg / $tc[$i]->avi) / 10) * 63) + 63);					// velocity calc
	 $duration = floor(($tc[$i]->avi / $chg) * 1000);						// duration of note  
	 $eventtime = $tc[$i]->eventtime + $duration;					// actual time of event
  
	  $tc[$i]->prevol = $row['volume'];				// set to current volume  for next iteration
	  $tc[$i]->eventtime = $eventtime;				// set to current event time for next iteration
	  $tc[$i]->prevtime = $row['qtime'];			// save previous time to weed out duplicates

	  $mn[$n]->channel = $i;				// format max messages
	  $mn[$n]->note = $note;
	  $mn[$n]->velocity = $velocity;
	  $mn[$n]->duration = $duration;
	  $mn[$n]->eventtime = $eventtime;		
 
	 echo "<tr>";
	 echo "<td>" . $row['ticker'] . "</td>";
	 echo "<td>" . $row['price'] . "</td>";
	 echo "<td>" . $row['volume'] . "</td>";
	 echo "<td>" . $row['qtime'] . "</td>";
	 echo "<td>" . $i . "</td>";
	 echo "<td>" . $note . "</td>";
	 echo "<td>" . $velocity . "</td>";
	 echo "<td>" . $duration . "</td>";
	 echo "<td>" . $eventtime . "</td>";
 
	 echo "</tr>";
	 $n++;
	 }
 else
 	{
 	array_pop($mn);						// if duplicate, reduce the size of the midinote array by one element to prevent sort errors
 	}
 }
echo "</table>";

mysql_close($con);

echo "all set" ;

// sort the maxnote array by eventtime

	usort($mn, 'cmp');

// insert the delay times calculated from sorted eventtimes


for($n = 0; $n < count($mn); $n++)	
	{
	if($n > 0)
		$mn[$n]->delay = $mn[$n]->eventtime - $mn[$n -1]->eventtime;
	else
		$mn[$n]->delay = 0;
	} 

// display the sorted array  

echo "<table border='1'>
<tr>
<th>eventtime</th>
<th>note</th>
<th>velocity</th>
<th>duration</th>
<th>channel</th>
<th>delay</th>

</tr>";

 
for($n = 0; $n < count($mn); $n++)			
 { 
 echo "<tr>";
 
 echo "<td>" . $mn[$n]->eventtime . "</td>";
 echo "<td>" . $mn[$n]->note . "</td>";
 echo "<td>" . $mn[$n]->velocity  . "</td>";
 echo "<td>" . $mn[$n]->duration  . "</td>";
 echo "<td>" . $mn[$n]->channel . "</td>";
 echo "<td>" . $mn[$n]->delay . "</td>";
 
 echo "</tr>";
 }



// send off the max notes

	playnotes( $mn, $globalmaxip );
	
	
//	flush();
//	ob_flush();


	echo "woo hoo";
	
exit();

// return json version of data 

echo json_encode($qq);

exit();




?>
