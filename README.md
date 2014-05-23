# internet-sensors projects

May 22, 2014

documentation: [http://zerokidz.com/ideas/?p=5859
](http://zerokidz.com/ideas/?p=5859)

---
 
## overview

Projects that use Max and Internet API's for interactive media.

* Projects tested on Mac OS 10.9.3
* Max projects use Max/MSP 6.1.7 from: [http://cycling74.com](http://cycling74.com) 
* Pd projects use Pure Data extended from: [http://puredata.info](http://puredata.info)
* Other dependencies listed in the documentation for individual projects.

---
## project index

documentation: [http://zerokidz.com/ideas/?p=5859
](http://zerokidz.com/ideas/?p=5859)


* Twitter streaming API in Max
* Sending tweets from Max using curl
* Send and receive Tweets in Max using ruby*
* Speech to text in Max 
* A conversation with a robot in Max 
* Playing bird calls in Max 
* Soundcloud API in Max 
* Real time train map using Max and node.js 
* Playing stock market music in Max 
* Using weather forecast data to drive weather sounds in Pure Data
* Using ping times to control oscillators in Max
* Echo Nest segment analysis player 
* Flying a Quad-copter AR_Drone with Max
* Adding Markers to Google Maps in Max
* Max data recorder
* Web Audio Google domain ping machine

*Now you can Tweet using a Fisher Price Little-Tikes piano

---

## files

Projects are now in separate folders.

---
## authorization

Some projects require passwords and API-keys from providers. For example, you'll need a Twitter dev account to run the 'Twitter streaming API in Max' project. 

For projects which need authorization you'll need to modify the patches/source code with your user information - as directed - or they just won't work.


---
## help

The API's used in the projects change often. If you find problems or have ideas - please post an issue or email me at tkzic@megalink.net 

---

## Revision history

May 22, 2014 - 

* Added stock market project

---


May 20, 2014 - 

* Moved all projects into folders
* Pd Wind project is ~~broken~~ now fixed!
* refactored ruby twitter client (now receives tweets)


---

[note 5/13/2014]: 
1) Added quadcopter AR_drone project

---

[note 5/1/2014]: 
1) Fixed ‘blocking’ in google speech and chatbot apps when togging voice record
2) added missing file autorecord-buffer2.maxpat
3) NOTE: still need to update documentation for the auto record / chatbot projects


---

[note 3/26/2014]: 
1) Complete revision of chatbot conversation project - cleaned up UI, added auto record feature
2) Fixed minor bugs in streaming Max twitter php code
3) updated google text to speech api program (also does auto record)
4) NOTE: still need to update documentation for the auto record / chatbot projects


---

[note 2/2/2014]: 
1) Complete revision of streaming Max Twitter project.
2) Added new project: segment analysis player that sonifies echonest audio analysis data.

---

[note 9/8/2013]: 
Yet another change for Twitter. In the Max patch which sends Tweets using a ruby server, you no longer need to use xively.com and zapier.com but you do need to set up a Twitter app to get the oauth authentication strings for the ruby program. Instructions are at: http://zerokidz.com/ideas/?p=7013 - I think this is useful because its faster, more direct, and free!

---

[note 9/2/2013]: Surprise! Any of the projects which used Twitter were now broken in June 2013, due to requirement for Oauth and some changes to the Twitter API version 1.1, and changes to cosm.com (now xively.com) - I have fixed the programs and revised documentation. 9/2/2013. For sending Tweets you'll need to adjust your xively.com triggers using zapier.com. For streaming Tweets there is new php code and you'll need to set up a Twitter App under your account - but this is all in the revised documentation at the link above.


---

[note]: the wind forecast API from http://cordc.ucsd.edu appears to be broken. There's no data. As a 
workaround, I have written a new pd patch and ruby script to use data from http://openweathermap.org (OWM) -
So... until I get a chance to write up documentation, please make the following substitutions when
running the 'wind' project:

wind-open-forecast.rb replaces: wind-forecast.rb

wind-open-machine.pd replaces: wind-machine.pd

The API's are different - OWM gives a 7 day forecast with fewer data points, but it has worldwide data,
more weather params, and after some tweaks... Actually the gust data sounds cool. And it defaults to 
Rumford, Maine when you start the server. 



