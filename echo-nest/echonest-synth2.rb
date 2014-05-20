#!/usr/bin/env ruby


# file: echonest-synth2.rb
# 3/26/2013
#
# try to control a synth in max using echonest analysis data 
#
#  we'll actually do the API calls from ruby in this version  
#
#

require 'rubygems'
require 'osc-ruby'
require 'patron'
require 'json'
require 'uri' # for url string conversion


lat = "36.99"
lon = "-122.03"
cityID = "4977125" # rumford maine
need_to_request = false
got_analysis = false

APIKEY = "TV2C30KWL899VIT9P"  # replace with your API Key from developer.echonest.com
artist = "John Coltrane"
title = "Offering"

playback_rate = 1.0 # sets the time interval multiplier for sending segment records
play = false;
pause = false;
stop = true;
sleep_time = 1

def timestamp_to_gmt_civil(ts)
  t = Time.at(ts).utc
  [t.year, t.month, t.mday, t.hour, t.min, t.sec]
end

# initialize OSC
#
@server = OSC::Server.new( 3332 )     # this is where I'm listening
@client = OSC::Client.new( 'localhost', 3333 )  # this is the target, ie a Max patch on this computer


# add methods to server which listens for OSC messages from Pure Data

# sets playback rate multiplier of data
@server.add_method '/rate' do | message |
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console
  playback_rate = message.to_a[0].to_f
  @client.send(OSC::Message.new( "/response ", 0 ));
   @client.send(OSC::Message.new( "/message ", "/rate #{playback_rate}" ));
end

# /stop
@server.add_method '/stop' do | message |
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console
  stop = true;
  play = false;
  pause = false;
  @client.send(OSC::Message.new( "/response ", 0 ));
   @client.send(OSC::Message.new( "/message ", "/stop" ));
end

# /pause
@server.add_method '/pause' do | message |
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console
  stop = false;
  play = false;
  pause = true;
  @client.send(OSC::Message.new( "/response ", 0 ));
   @client.send(OSC::Message.new( "/message ", "/pause" ));
end

# /play
@server.add_method '/play' do | message |
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console
  stop = false;
  play = true;
  pause = false;
  @client.send(OSC::Message.new( "/response ", 0 ));
  @client.send(OSC::Message.new( "/message ", "/play" ));
end


# /title - stores a song title
@server.add_method '/title' do | message |
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console
  
  title = message.to_a[0]
  
  puts "new title: #{title}"
  @client.send(OSC::Message.new( "/response ", 0 ));
  @client.send(OSC::Message.new( "/message ", "/title #{title}" ));
  # need_to_request = true
end

# /artist - stores an artist name
@server.add_method '/artist' do | message |
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console
  
  artist = message.to_a[0]
  
  puts "new artist: #{artist}"
  @client.send(OSC::Message.new( "/response ", 0 ));
  @client.send(OSC::Message.new( "/message ", "/artist #{artist}" ));
  # need_to_request = true
end

# /analyze - searches for track and fetches new analysis data
@server.add_method '/analyze' do | message |
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console

  puts "searching for track data: #{artist} : #{title}..."
  @client.send(OSC::Message.new( "/message ", "searching for track data: #{artist} : #{title}..." ));
  need_to_request = true
end


# fire up the server
Thread.new do
  @server.run
end



# initialize first http: request to echo nest to get track data and analysis url
#
sess = Patron::Session.new
sess.base_url = "http://developer.echonest.com"
sess.timeout = 15
sess.enable_debug "./en-synth2.debug"

# initialize analysis session
# note we probably don't need to do another session for this

sess_a = Patron::Session.new
sess_a.base_url = "http://developer.echonest.com"
sess_a.timeout = 15
sess_a.enable_debug "./en-synth2_a.debug"

# main processing loop
#

while 1

  # run the track query request 
  #
  # there's absolutely no error checking!

  if need_to_request == true
    
    puts "running new track request..."
    resp = sess.get("/api/v4/song/search?api_key=#{APIKEY}&format=json&results=1&artist=#{URI.escape(artist)}&title=#{URI.escape(title)}&bucket=id:7digital-US&bucket=audio_summary&bucket=tracks")
    
    puts "status: #{resp.status}\n"
    puts resp.body
    puts 
   
    track = JSON.parse(resp.body)
    puts JSON.pretty_generate(track)

    # need minimal error checking
    
    analysis_url = track['response']['songs'][0]['audio_summary']['analysis_url']
    puts analysis_url
    
    # send acknowledgement to client
  
    @client.send(OSC::Message.new( "/response ", "#{resp.status}")); 
    @client.send(OSC::Message.new( "/message ", "analysis url: #{analysis_url}"));
    
    # now get analysis data
    #
    
    # initialize first http: request to echo nest to get track data and analysis url
    #
    
    sess_a.base_url = analysis_url
    resp = sess_a.get("");
    puts "status: #{resp.status}\n"
    puts resp.body
    puts
    
    analysis = resp.body
    
    # ok here's the shortcut for testing
    # read the analysis data
    # analysis = File.read("enfb-analysis.json")
    # puts analysis

    # parse analysis data into mysterious x object 

    x = JSON.parse(analysis)

    # display some header info

    sample_rate = x['meta']['sample_rate']
    track_duration = x['track']['duration']
    num_segments = x['segments'].length
    segment_24_start = x['segments'][24]['start']

    puts sample_rate
    puts track_duration
    puts num_segments
    puts segment_24_start
    
     # send acknowledgement to client

    @client.send(OSC::Message.new( "/response ", "#{resp.status}"));
    @client.send(OSC::Message.new( "/message ", "number of segments: #{num_segments}"));
    
  
    need_to_request = false
    got_analysis = true
    
    # send global headers
    
    msg = x['track']['key'] 
    puts "/key #{msg}" 
    @client.send(OSC::Message.new( "/key ", msg ));
    
    msg = x['track']['mode'] 
    puts "/mode #{msg}" 
    @client.send(OSC::Message.new( "/mode ", msg ));
    
  end


  # loop through analysis segments and send out as sequential OSC messages 
  
  if(got_analysis)

    i = 0
    while(i < x['segments'].length )
      
      if(play)
    
        # x['segments'].each do | seg |
        seg = x['segments'][i]

        # pitch
        # make pitch message using all twelve pitch values
        msg = ""
        seg['pitches'].each do | note |
          fnote = note.to_f
          msg = msg + "#{fnote} "
        end   
        puts "/pitch #{msg}" 
        @client.send(OSC::Message.new( "/pitch ", msg ));
    
        # timbre
    
        msg = ""
        seg['timbre'].each do | tim |
          ftim = tim.to_f 
          msg = msg + "#{ftim} "
        end   
        puts "/timbre #{msg}" 
        @client.send(OSC::Message.new( "/timbre ", msg ));
    
        msg = ""
        #  
        #  envelope 
        #
        msg = msg + "#{seg['start']} "
        msg = msg + "#{seg['duration']} "
        msg = msg + "#{seg['confidence']} "
        msg = msg + "#{seg['loudness_start']} "
        msg = msg + "#{seg['loudness_max_time']} "
        msg = msg + "#{seg['loudness_max']} "
        if(i + 1 < x['segments'].length)
          msg = msg + "#{x['segments'][i + 1]['loudness_start']} "
        else 
          msg = msg + "-72.0 "
        end
        puts "/env #{msg}"
        @client.send(OSC::Message.new( "/env ", msg ))
     
    
        # use current segment duration as sleep interval
        sleep_time = seg['duration'].to_f 
      end # if (play)
     
      if (need_to_request)
        got_analsysis = false
        break
      end   
  
      if(!pause)  
        i = i + 1 
      end
      
      if (stop)
        i = 0
      end
      
      sleep_time = sleep_time / playback_rate;
      sleep(sleep_time)
      
    end # end of while loop for segments
  end # end of if (got_analysis)

end # end of main run loop


# this program ends will you kill it with ctrl-c
