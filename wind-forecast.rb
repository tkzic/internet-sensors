#!/usr/bin/env ruby


# file: wind-forecast.rb
#
# 
# get current wind forecast data from Scripps Institute of Oceanography
# coastal observing r & d center
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

# triggers a new search
@server.add_method '/search' do | message |
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console
  
  lat = message.to_a[0]
  lon = message.to_a[1]
  puts "new lat:#{lat}, lon:#{lon}"
  need_to_request = true
end

# fire up the server
Thread.new do
  @server.run
end


# initialize http: request (patron) to get current timestamps
#
sess = Patron::Session.new
sess.base_url = "http://cordc.ucsd.edu"
sess.timeout = 15
sess.enable_debug "./wind.debug"

# main processing loop
#

while 1

  # run the get request 
  #

  if need_to_request == true
    
    puts "running new request..."
    
    resp = sess.get("/js/COAMPS/query.php?ll=#{lat},#{lon}&fmt=json")

    puts "status: #{resp.status}\n"
    puts resp.body
    puts "\n"

    windData = JSON.parse(resp.body)

    # display the response in JSON

    puts JSON.pretty_generate(windData)

    # display the timestamp from the first data record

    ts = "#{windData['records'][0][0]}"
    puts ts
    d = timestamp_to_gmt_civil(ts.to_i)
    puts "ts:#{d[1]}/#{d[2]}/#{d[0]}:#{d[3]}:#{d[4]}:#{d[5]}"
    
    
    need_to_request = false
  end  

  # now loop through the records and send the data to pd - this is lazy programming to 
  # play the loop forwards, then backwards -
  
  windData['records'].each do | rec |
    msg = ""
    rec.each do |field|
      print "#{field} "
      msg = msg + "#{field} "  
    end
    # convert time stamp
    d = timestamp_to_gmt_civil(rec[0].to_i)
    msg = msg + "#{d[1]}/#{d[2]}/#{d[0]}:#{d[3]}:#{d[4]}:#{d[5]}"
    puts 
    @client.send(OSC::Message.new( "/wind", msg ));
    sleep(playbackRate)
  end
  
  windData['records'].reverse.each do | rec |
    msg = ""
    rec.each do |field|
      print "#{field} "
      msg = msg + "#{field} "
    end
    # convert time stamp
    d = timestamp_to_gmt_civil(rec[0].to_i)
    msg = msg + "#{d[1]}/#{d[2]}/#{d[0]}:#{d[3]}:#{d[4]}:#{d[5]}"
    puts 
    @client.send(OSC::Message.new( "/wind", msg ));
    sleep(playbackRate)
  end

end


# this program ends will you kill it with ctrl-c
