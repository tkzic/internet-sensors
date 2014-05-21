#!/usr/bin/env ruby


# file: wind-forecast.rb
# 3/25/2013
#
# revising this program to use the openweathermap.org API because the scripps thing mysteriously vanished
#
# 
# get current wind forecast data from Scripps Institute of Oceanography
# coastal observing r & d center

# 
#
# for now we're getting all current forecast data for Santa Cruz: 36.99, -122.03
#
#

require 'rubygems'
require 'osc-ruby'
require 'patron'
require 'json'


lat = "36.99"
lon = "-122.03"
cityID = "4977125" # rumford maine
need_to_request = true

playbackRate = 0.15 # sets the time interval in seconds between sending of wind records

def timestamp_to_gmt_civil(ts)
  t = Time.at(ts).utc
  [t.year, t.month, t.mday, t.hour, t.min, t.sec]
end

# initialize OSC
#
@server = OSC::Server.new( 3332 )     # this is where I'm listening
@client = OSC::Client.new( 'localhost', 3333 )  # this is the target, ie a Max patch on this computer


# add methods to server which listens for OSC messages from Pure Data

# sets playback rate of wind data
@server.add_method '/rate' do | message |
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console
  playbackRate = message.to_a[0].to_f
end

# triggers a new city using city id code
@server.add_method '/city' do | message |
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console
  
  cityID = message.to_a[0]
  
  puts "new cityID: #{cityID}"
  need_to_request = true
end

# fire up the server
Thread.new do
  @server.run
end


# initialize http: request (patron) to get current timestamps
#
sess = Patron::Session.new
sess.base_url = "http://api.openweathermap.org"
sess.timeout = 15
sess.enable_debug "./wind-open.debug"

# main processing loop
#

while 1

  # run the get request 
  #

  if need_to_request == true
    
    puts "running new request..."
    
    resp = sess.get("/data/2.1/forecast/city/#{cityID}")

    puts "status: #{resp.status}\n"
    puts resp.body
    puts "\n"

    windData = JSON.parse(resp.body)

    # display the response in JSON

    puts JSON.pretty_generate(windData)

    # display the timestamp from the first data record

    ts = "#{windData['list'][0]['dt']}"
    puts ts
    d = timestamp_to_gmt_civil(ts.to_i)
    puts "ts:#{d[1]}/#{d[2]}/#{d[0]}:#{d[3]}:#{d[4]}:#{d[5]}"
    
    
    need_to_request = false
  end  



  # now loop through the records and send the data to pd - this is lazy programming to 
  # play the loop forwards, then backwards -
  
  windData['list'].each do | rec |
    msg = ""
    # 5/2014 - need to do this check for empty records - not sure why?
    if(!rec['main']) 
      break;
    end
    # records have names in owm !
    # 
    msg = msg + "#{rec['dt']} "
    msg = msg + "#{windData['city']['coord']['lat']} "  
    msg = msg + "#{windData['city']['coord']['lon']} " 
    msg = msg + "#{rec['main']['pressure']} "
    msg = msg + "#{rec['wind']['speed']} " 
    msg = msg + "#{rec['wind']['deg']} "  
    
    gust = 0.0
    if(rec['wind']['gust'])
      gust = rec['wind']['gust']
    end
    msg = msg + "#{gust} "
    
    rain = 0.0
    if(rec['rain'])
      rain = rec['rain']['3h']
    end
    msg = msg + "#{rain} "
    
    snow = 0.0
    if(rec['snow'])
      snow = rec['snow']['3h']
    end
    print "#{snow} "
    msg = msg + "#{snow} "
      
    # convert time stamp
    d = timestamp_to_gmt_civil(rec['dt'].to_i)
    print "#{d[1]}/#{d[2]}/#{d[0]}:#{d[3]}:#{d[4]}:#{d[5]}"
    msg = msg + "#{d[1]}/#{d[2]}/#{d[0]}:#{d[3]}:#{d[4]}:#{d[5]}"
    
    puts msg 
    @client.send(OSC::Message.new( "/wind", msg ));
    sleep(playbackRate)
    # puts "next record dude..."
  end
  
  
  windData['list'].reverse.each do | rec |
    msg = ""
    # 5/2014 - need to do this check for empty records - not sure why?
    if(!rec['main']) 
      break;
    end
    # records have names in owm !
    # 
    msg = msg + "#{rec['dt']} "
    msg = msg + "#{windData['city']['coord']['lat']} "  
    msg = msg + "#{windData['city']['coord']['lon']} " 
    msg = msg + "#{rec['main']['pressure']} "
    msg = msg + "#{rec['wind']['speed']} " 
    msg = msg + "#{rec['wind']['deg']} "  
    
    gust = 0.0
    if(rec['wind']['gust'])
      gust = rec['wind']['gust']
    end
    msg = msg + "#{gust} "
    
    rain = 0.0
    if(rec['rain'])
      rain = rec['rain']['3h']
    end
    msg = msg + "#{rain} "
    
    snow = 0.0
    if(rec['snow'])
      snow = rec['snow']['3h']
    end
    print "#{snow} "
    msg = msg + "#{snow} "
      
    # convert time stamp
    d = timestamp_to_gmt_civil(rec['dt'].to_i)
    print "#{d[1]}/#{d[2]}/#{d[0]}:#{d[3]}:#{d[4]}:#{d[5]}"
    msg = msg + "#{d[1]}/#{d[2]}/#{d[0]}:#{d[3]}:#{d[4]}:#{d[5]}"
    
    puts msg 
    @client.send(OSC::Message.new( "/wind", msg ));
    sleep(playbackRate)
  end

end


# this program ends will you kill it with ctrl-c
