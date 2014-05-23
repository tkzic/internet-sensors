

// selectstock.js 

// global variables

var xmlHttp;		// for the showstock function
var xmlHttpPlay;	// for the play function
var tracking = 0;
var automode = 0;	// automatic mode for open market, keeps getting quotes and playing the music 
var loopmode = 0;	// loop mode for playing: repeats the sequence at given interval
var quoteloopmode = 0;	// loop mode for getting stock quotes:

var timedquote;				// for setting and clearing interval timer
var timedplay;

var debug_mode = "off";		// global for debugging mode

var globalMaxIP = "192.168.1.119";	// IP address of Computer running Max Patch that will play the music

/////////////////////////////////////////////////////////////////////
// fill in the quote data returned from query

function fill_quotetable(e)
{


// this needs to be changed to a table structure, like google finance, so the quotes are readable

/*
<table border="1">
<tr>
<th>Heading</th>
<th>Another Heading</th>
</tr>
<tr>
<td>row 1, cell 1</td>
<td>row 1, cell 2</td>
</tr>
<tr>
<td>row 2, cell 1</td>
<td>row 2, cell 2</td>
</tr>
</table> 

*/

// alert (" here " );

var i;	// counter
var n;  // counter for div tags
var maxquotes = 12;	// maximum number of quotes in the table
var qstr1, qstr2;
var a, b;  // for calculations
var chng;

// get list of all div tags and find the one at the beginning of the table 

var p = document.getElementsByTagName("div");
for(n = 0; n < p.length; n++)
	{
	if(p[n].id == "q0")
		{
//		alert( "found element q0" );
		found = true;
		break; 
		}
	}
	
if(!found)
	return false;

// fill in each quote

// make table header



	qstr1 = "";
	
for(i = 0; i < e.length; i++ )
	{
	
	if( i == 0)		// do the table header
		{
		qstr1 = "<table border='1'><tr><th>ticker</th><th>price</th> <th>change</th> <th>open</th> <th>low</th> <th>high</th> ";
		qstr1 = qstr1 + "<th>volume</th> <th>date</th> <th>time</th> </tr>" ;
		}
		
	qstr1 = qstr1 + "<tr> <td>" + e[i].ticker + "</td>";
	qstr1 = qstr1 +	"<td>" + e[i].price + "</td> ";
	qstr1 = qstr1 +	"<td>" + e[i].change + "</td> ";
	qstr1 = qstr1 +	"<td>" + e[i].open + "</td> ";
	qstr1 = qstr1 +	"<td>" + e[i].low + "</td> ";
	qstr1 = qstr1 +	"<td>" + e[i].high + "</td> ";
	qstr1 = qstr1 +	"<td>" + e[i].volume + "</td> ";
	qstr1 = qstr1 +	"<td>" + e[i].qdate + "</td> ";
	qstr1 = qstr1 +	"<td>" + e[i].qtime + "</td> </tr>";




	
//	\t" + e[i].change + "\t" + e[i].qdate;
//	qstr2 = "\t" + e[i].qtime + " " + e[i].open + "\t" + e[i].low + "\t" + e[i].high + "\t" + e[i].volume + "\t" + e[i].spare ;

//    p[n].innerHTML = p[n].innerHTML + qstr1;
//    p[n].style.display = "block";
//    chng = parseFloat(e[i].price) - parseFloat(e[i].open);
    
//    alert (String(chng));
    
/*    if(chng >= 0.0)
    	 p[n].style.color = "green";
	else
		 p[n].style.color = "red";
		 
*/		 
//	n++;
	}
	
//  if we had data, then add the table footer

	if(i > 0)
		{
		p[n].innerHTML = qstr1 + "</table>" ;
   	  p[n].style.display = "block";

		n++;
		}	
// if we didn't fill the entire table, then blank out the remaining slots

while(i < maxquotes)
	{
	p[n].style.display = "none";
	n++;
	i++;
	}
	
 return true;

}

///////////////////////////////////////////////////////////////////
function setIP() // gets called when user inputs new IP
{
	
		globalMaxIP = document.myform.maxip.value; 
		
		alert("new max ip address:" + globalMaxIP);		
	
}

////////////////////////////////////////////////////////////////////
function setdates()	// gets called on load - now also setting IP address of Max
{

	var d = new Date() ;
	var sdate =  (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear() ;
	var stime = "09:29";
	var edate = sdate;
	var etime = "16:02";
	
	document.myform.qstartdate.value = sdate;
	document.myform.qstarttime.value = stime;
	document.myform.qenddate.value = edate;
	document.myform.qendtime.value = etime;
	
	document.myform.maxip.value = globalMaxIP;

}
////////////////////////////////////////////////////////////////////
function settrack()
{
	var pl = document.getElementById("trackb");
	
	if(pl.value == "tracking-")
		{
		pl.value = "tracking+";
		pl.style.color = "green";
		tracking = 1;
		}
	else
		{
		pl.value = "tracking-";
		pl.style.color = "red";
		tracking = 0;
		}
			
	return true;
}

////////////////////////////////////////////////////////////////////
function setdebug()	//toggle debugging mode
{
	var pl = document.getElementById("debugb");
	
	if(pl.value == "debug-")
		{
		pl.value = "debug+";
		pl.style.color = "green";
		debug_mode = "on";
		}
	else
		{
		pl.value = "debug-";
		pl.style.color = "red";
		debug_mode = "off" ;
		}
			
	return true;
}

///////////////////////////////////////////////////////////////////
//
// retrieve stock data and create musical instructions
//
function play()
{

xmlHttpPlay = GetXmlHttpObject();
if (xmlHttpPlay==null)
 {
 alert ("Browser does not support HTTP Request");
 return;
 }
 
// build url string

var url="play3.php";

url=url+"?q="+ document.myform.symbol.value;									// stock quote list

url=url+"&qstartdate=" + document.myform.qstartdate.value;							// start date
url=url+"&qstarttime=" + document.myform.qstarttime.value;							// start date
url=url+"&qenddate=" + document.myform.qenddate.value;							// start date
url=url+"&qendtime=" + document.myform.qendtime.value;							// start date

url=url+"&debug=" + debug_mode;								// debugging mode

url = url + "&maxip=" + globalMaxIP;				// IP address of Max patch computer   

url=url+"&sid="+Math.random();						// random value to force cache

xmlHttpPlay.onreadystatechange=stateChangedPlay;	// set response handler function
xmlHttpPlay.open("GET",url,true);
xmlHttpPlay.send(null);

}

//////////////////////////////////////////////////////////////////////
//
// response handler for the play function

function stateChangedPlay() 
{ 
if (xmlHttpPlay.readyState==4 || xmlHttpPlay.readyState=="complete")
 { 
 document.getElementById("txtPlay").innerHTML =  xmlHttpPlay.responseText;
 // var playresp = eval( xmlHttpPlay.responseText );
 // document.myform.mssp.value = 
 } 
}


///////////////////////////////////////////////////////////////////
function setauto()
{

	var pl = document.getElementById("autob");					// auto button
	
	
	if(pl.value == "auto-")
		{
		pl.value = "auto+";
		pl.style.color = "green";
		automode = 1;
		timedquote = setInterval("autoquote()", 1000 );
		timedplay = setInterval("autoplay()", 1000 );

		
		}
	else
		{
		pl.value = "auto-";
		pl.style.color = "red";
		automode = 0;
		clearInterval(timedquote);
		clearInterval(timedplay);
		}
			

	return true;
}

////////////////////////////////////////////////////////////////////
function autoquote()
{

// this function gets called every second if auto is pressed
// it runs the 'second' clock on the active button
// automatically fire off stock quote every minute

	var x = new Date();
	var s = x.getSeconds();


// this is a clock indicator 

	var zl = document.getElementById("activeb");
	zl.value = s;
	zl.style.color = "green";

		
	
	if( s == 30 )
		showstock();
	

}
	
////////////////////////////////////////////////////////////////////
function autoplay()
{

// gets called every second
// calls play function at interval set in the play interval text box

	var intplay = document.getElementById("playint").value;	
	var x = new Date();
	var s = x.getSeconds();
	var m = x.getMinutes();	
		
	var totalsec = (m * 60) + s;

	
	if((totalsec % intplay) == 0 )
		play();
		
}

///////////////////////////////////////////////////////////////////
function setloop()  // toggles loop mode for play
{

	// first we should check if already looping in automode and just exit
	
	if(automode == 1)
		return;

	var pl = document.getElementById("loopb");					// loop button
	
	
	if(pl.value == "loop-")
		{
		pl.value = "loop+";
		pl.style.color = "green";
		loopmode = 1;
		// timedquote = setInterval("autoquote()", 1000 );
		timedplay = setInterval("autoplay()", 1000 );

		// play right now so the user doesn't have to wait for next interval
		play();
		
		}
	else
		{
		pl.value = "loop-";
		pl.style.color = "red";
		loopmode = 0;
		// clearInterval(timedquote);
		clearInterval(timedplay);
		}
			

	return true;
}

///////////////////////////////////////////////////////////////////
function setquoteloop()  // toggles loop mode for getting quotes
{

	// first we should check if already looping in automode and just exit
	
	if(automode == 1)
		return;

	var pl = document.getElementById("quoteloopb");					// loop button
	
	
	if(pl.value == "loop-")
		{
		pl.value = "loop+";
		pl.style.color = "green";
		quoteloopmode = 1;
		timedquote = setInterval("autoquote()", 1000 );
		// timedplay = setInterval("autoplay()", 1000 );

		// quote right now so the user doesn't have to wait for next interval
		showstock();
		
		}
	else
		{
		pl.value = "loop-";
		pl.style.color = "red";
		quoteloopmode = 0;
		clearInterval(timedquote);
		// clearInterval(timedplay);
		}
			

	return true;
}




///////////////////////////////////////////////////////////////////

function showstock()
{
// check for empty ticker symbol field
var str = document.myform.symbol.value;

if(str == "") {
	alert("need to enter stock ticker symbols to get a quote");
	return;
} 	
	
xmlHttp=GetXmlHttpObject();
if (xmlHttp==null)
 {
 alert ("Browser does not support HTTP Request");
 return;
 }
var url="getstock3.php";
// var str = document.myform.symbol.value;

url=url+"?q="+str;							// stock quote list
url=url+"&tracking=" + tracking;			// tracking switch 0/1
url=url+"&sid="+Math.random();				// random value to force cache

xmlHttp.onreadystatechange=stateChanged;	// set response handler function
xmlHttp.open("GET",url,true);
xmlHttp.send(null);
}

//////////////////////////////////////////////////////////////////////
function stateChanged() 
{ 
if (xmlHttp.readyState==4 || xmlHttp.readyState=="complete")
 { 
 document.getElementById("txtHint").innerHTML =  xmlHttp.responseText;
 var j = eval( xmlHttp.responseText );
 fill_quotetable(j);
 } 
}

//////////////////////////////////////////////////////////////////////
function GetXmlHttpObject()
{
var xmlHttp=null;
try
 {
 // Firefox, Opera 8.0+, Safari
 xmlHttp=new XMLHttpRequest();
 }
catch (e)
 {
 //Internet Explorer
 try
  {
  xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");
  }
 catch (e)
  {
  xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");
  }
 }
return xmlHttp;
}

