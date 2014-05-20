#!/usr/bin/env ruby
#
# file: domain-ping.rb
#
#  listens for /xping messages from max client
#  pings a domain name
#  sends back the /time to max  
#
#

require 'rubygems'
require 'osc-ruby'
require 'patron'
require 'json'

#
APIKEY = 'sqhdPxtFo5GXTgyIVE5I4B47LVAcZkxn'   # put your mashape API-KEY here
#

# initialize http: request (patron) 
#
sess = Patron::Session.new
sess.base_url = "https://igor-zachetly-ping-uin.p.mashape.com/pinguin.php"
sess.timeout = 15
sess.headers['X-Mashape-Authorization'] = APIKEY 
sess.enable_debug "./google.debug"

#
# initialize OSC
#
@server = OSC::Server.new( 3332 )     # this is where I'm listening
@client = OSC::Client.new( 'localhost', 3333 )  # this is the target, ie a Max patch on this computer

# add methods to server 

# callback for osc message [xping/ n domain] 
# runs http: request with mashape API to get ping data for domain
# send osc message [/time n pingDuration] back to client
#
@server.add_method '/xping' do | message |
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console
  # break out fields
  ndx = message.to_a[0];
  url = message.to_a[1];
  # run http: request
  resp = sess.get("?address=#{url}")
  puts "status: #{resp.status}\n"
  puts resp.body
  # convert to JSON
  js = JSON.parse(resp.body)
  # test result and send osc message to client
  if(js['result'].casecmp("true") == 0)    
     @client.send(OSC::Message.new( "/time", ndx.to_i, js['time'].to_f ));
   else
     @client.send(OSC::Message.new( "/time", ndx.to_i, 0.0 ));
  end
  
end

# start the server
Thread.new do
  @server.run
end

puts "waiting for requests..."

sleep(1000000)

# this program ends will you kill it with ctrl-c
#
# in the future it will listen for /quit messages
#
