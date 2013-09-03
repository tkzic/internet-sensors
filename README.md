internet-sensors
README.md
September 2, 2013

A web version of this document (with pictures) can be found at: http://zerokidz.com/ideas/?p=5859


---

[note]: Surprise! Any of the projects which used Twitter were now broken in June 2013, due to requirement for Oauth and some changes to the Twitter API version 1.1, and changes to cosm.com (now xively.com) - I have fixed the programs and revised documentation. 9/2/2013. For sending Tweets you'll need to adjust your xively.com triggers using zapier.com. For streaming Tweets there is new php code and you'll need to set up a Twitter App under your account - but this is all in the revised documentation at the link above.


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


---
overview:

This is a series of projects that demonstrate ways to use Internet API's for interactive media projects.

Projects have been tested on Mac OS 10.7 (Lion). All but one of the projects use Max/MSP 6.1.0 from: http://cycling74.com. The other project uses Pure Data 0.42.5 (extended) from: http://puredata.info. Other required programs are listed in the documentation for individual projects.

---
downloads:

The links for the projects below include operating instructions. All the patches, source code, and data can be downloaded from the github repository:

 https://github.com/tkzic/internet-sensors

---
authorization:

Some of the projects require you to get passwords and API-keys from providers. For example, you'll need a Twitter account, to run the 'Twitter streaming API in Max' project. For projects which need authorization you'll need to modify the patches/source code with your user information - as directed - or they just won't work.

---
help:

The API's used in the projects change fairly often. So there's no guarantee they'll work. If you find problems or have ideas - please post to them to the github repository. Or email me at tkzic@megalink.net with "Internet sensor projects" somewhere in the subject heading.

---
Projects:

---

Twitter streaming API in Max (FM, php, curl, geocoding, [aka.speech], Soundflower, Morse code, OSC, data recorder)

http://zerokidz.com/ideas/?p=5786

//

Sending tweets from Max using curl ([sprintf], [aka.shell], cosm API, JSON, javascript Twitter API)

http://zerokidz.com/ideas/?p=5447

//
 
Sending tweets from Max using ruby (cosm API, JSON, javascript Twitter API, OSC)

http://zerokidz.com/ideas/?p=5818

//

Sending tweets from Max using speech (Google speech API, JSON, javascript, sox, cosm API, Twitter API)

http://zerokidz.com/ideas/?p=4690

//

A conversation with a robot in Max (Google speech API, sox, JSON,  pandorabots API, python, [aka.speech]

http://zerokidz.com/ideas/?p=4710

//

Playing bird calls in Max (xenon-canto API, [jit.uldl], [jit.qt.movie])

http://zerokidz.com/ideas/?p=4225

//

Soundcloud API in Max (JSON, javascript, curl, [aka.shell], [jit.qt.movie])

http://zerokidz.com/ideas/?p=5413

//

Real time train map using Max and node.js (XML, JSON, OSC, data recorder, web sockets, Irish Rail API)

http://zerokidz.com/ideas/?p=5477

//

playing stock market music with Max (OSC, netcat,  php, mysql, html, javascript, Yahoo API, linux)

[Note] This project is currently not part of the github archive.

http://zerokidz.com/ideas/?p=5499

//

Using wind forecast data to drive wind sounds in Pure Data (ruby, OSC, JSON, CORDC API, "Designing Sound" by Andy Farnell)

http://zerokidz.com/ideas/?p=5846

//

Using ping times to control oscilators in Max (Mashape ping-uin API, ruby, OSC, JSON)

http://zerokidz.com/ideas/?p=5945



