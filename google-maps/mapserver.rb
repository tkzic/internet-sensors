#!/usr/bin/env ruby


# file: wapOSCserver.rb
#
# 
# works with a Max patch wapOSCtester.maxpat 
#
# receives Osc messages from Max and sends them out via WebSockets to a forked version of WebAudioPlayground (WAP)
#
# note this program will crash if you send Osc messages to it before the WebSockets connect is initialized from the
# WAP program running in the Web browser
#

require 'rubygems'
require 'osc-ruby'
# require 'patron'
require 'em-websocket'
require 'json'


msg_data = 0.0
socket = EM::WebSocket

# initialize OSC
#
@osc_server = OSC::Server.new( 8000 )     # this is where I'm listening
@osc_client = OSC::Client.new( 'localhost', 9000 )  # this is the target, ie a Max patch on this computer


# add methods to server which listens for OSC messages 

# slider value
# can we wild card these? yes
# @osc_server.add_method '/mod/0/slider/0' do | message |
# @osc_server.add_method '/mod/*/*/*' do | message |  
@osc_server.add_method '/point' do | message |  
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console
  msg_data1 = message.to_a[0].to_f
  msg_data2 = message.to_a[1].to_f
  socket.send("#{message.address} #{msg_data1} #{msg_data2}") # send message out over WebSockets (should check if socket is open first)
end


# fire up the Osc server
Thread.new do
  @osc_server.run
end

puts "waiting for Osc messages..."

# ip = '192.168.1.104'
ip = 'localhost'


# now start up websockets server
EM.run {
  EM::WebSocket.run(:host => ip, :port => 1234) do |ws|
    ws.onopen { |handshake|               # this runs when browser (client) opens a connection
      puts "WebSocket connection open"
      socket = ws                         # assign websocket to global pointer so we can use it elsewhere in the program  

      # Access properties on the EM::WebSocket::Handshake object, e.g.
      # path, query_string, origin, headers

      # Publish message to the client
      ws.send "Hello Client, you connected to #{handshake.path}"
    }

    ws.onclose { puts "Connection closed" } # this runs when connection closes

    ws.onmessage { |msg|                    # this runs when a message comes back from the websockets client
      puts "Recieved message: #{msg}"
      ws.send "Pong: #{msg}"                # a sort of loopback
    }
  end
}


# this program ends will you kill it with ctrl-c
