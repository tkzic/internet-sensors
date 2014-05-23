<?php

// define value object for quote structure

class quote {
  var $ticker, $price, $qdate, $qtime, $change, $open, $high, $low, $volume, $ttime, $id, $spare, $sqldate;
}


// check for input 

if( $_GET['q'] == '' )
		exit("nothing to quote");

// get value of tracking switch  0/1
		
$tracking = $_GET['tracking'];

		
// split out the ticker symbols

$qarray = preg_split("/[\s,]+/", $_GET['q'] );
$qnum = count( $qarray );


// print_r ($qarray );
// print_r ($qnum );


// make an array of quote objects to store the retrieved quote data

$rr = array(new quote);
for($i = 0 ; $i < ($qnum - 1); $i++ )
	array_push($rr, new quote );


// $rr[0]->ticker = 'goo';	// test data
// $rr[1]->ticker = 'hoo'; // more test data

// print_r( $rr);	// display the array of structs (classes)

// make a timestamp for display purposes

	$tstamp =  date('l jS \of F Y h:i:s A');

// retrieve the quotes from yahoo .csv file

for( $i = 0; $i < $qnum; $i++ )
	{
	$searchticker = $qarray[$i];  // assign ticker symbol

//	echo "<br><br>";
//	echo "searching for: " . $searchticker . ":" . $i ;

	// note that there should only be one row in the file

	$handle = fopen("http://download.finance.yahoo.com/d/quotes.csv?s=$searchticker&f=sl1d1t1c1ohgv&e=.csv", "r");
	while (($data = fgetcsv($handle, 1000, ",")) !== FALSE)
		{
    	$num = count($data);
  
//    	echo "<br>";
//    	echo "field count: " . $num . " tick: " . $data[0] . " date field: " . $data[2] ;
// 		echo "<br>";
  		
	  	if(($num == 9) && ($data[2] != "N/A"))	// if we have a valid record
			{ 									// assign it to the quote object
		   $rr[$i]->ticker = $data[0];
		   $rr[$i]->price = $data[1];
			$rr[$i]->qdate = $data[2];
	 	   $rr[$i]->qtime = $data[3];
	 	   $rr[$i]->change = $data[4];
	 	   $rr[$i]->open = $data[5];
	 	   $rr[$i]->high = $data[6];
	 	   $rr[$i]->low = $data[7];
	 	   $rr[$i]->volume = $data[8];
	 	   
	 	   $rr[$i]->spare = $tstamp;
	 	   
			// date conversion 

			$dd = date_parse( $rr[$i]->qdate );
  			$tt = date_parse( $rr[$i]->qtime );
 		  	$rr[$i]->sqldate = $dd['year'] . "-" . $dd['month'] . "-" . $dd['day'] . " " . $tt['hour'] . ":" . $tt['minute'] . ":00";
  			}
		else
			{
			exit( "error: invalid ticker symbol: " . $searchticker );    
			}
	   }

	fclose($handle);	// close handle to make available for next read
	}
	


	


if($tracking == 0)		// if this is just a stock quote with no tracking then bail here
	{
	echo json_encode($rr);	// output json version of data 
	exit();
	}
	

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//	insert stock quotes into the quotes table


// open stocks database

$con = mysql_connect('localhost', 'webdb1', '34door');
if (!$con)
 {
 die('Could not connect: ' . mysql_error());
 }

mysql_select_db("stocks", $con);


// insert quotes into quotes table


	$qq = new quote;	// needed for query



for( $i = 0; $i < $qnum; $i++ )
	{
	
	$qq->ticker = $rr[$i]->ticker;
	$qq->price = $rr[$i]->price;
	$qq->sqldate = $rr[$i]->sqldate;
	$qq->change = $rr[$i]->change;
	$qq->open = $rr[$i]->open;
	$qq->high = $rr[$i]->high;
	$qq->low = $rr[$i]->low;
	$qq->volume = $rr[$i]->volume;
	
	$sql = "INSERT INTO quotes (ticker, price, qtime, pchange, popen, phigh, plow, volume) 
				VALUES ('$qq->ticker', '$qq->price', '$qq->sqldate', '$qq->change',
				 '$qq->open', '$qq->high', '$qq->low', '$qq->volume' )" ;
				
	$result = mysql_query($sql);
	if(!$result)
		{
		die('query error: ' . 'index: ' . $i . " "  . mysql_error());
	    }
	}

mysql_close($con);	// close database


// return json version of data 

echo json_encode($rr);

exit();


?>


