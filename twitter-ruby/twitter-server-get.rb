#!/usr/bin/env ruby

# file: twitter-server-get.rb
#
# this is a server that receives tweets for a particular user and then sends them to Max via Osc
#
# generally an OSC message can be anything - but usually is in the form:
#
#  /message-name message-value...
#

require 'rubygems'
require 'osc-ruby'
require 'json'
require 'twitter'

# authentication data from your registered read/write twitter app
# see dev.twitter.com/apps
#
# Twitter gem docs at: 

twitterClient = Twitter::Streaming::Client.new do |config|
# Twitter.configure do |config|
  config.consumer_key = "mqQtoYh16Ro77wy3reBK7QQ"       
  config.consumer_secret = "X0KexjlK453BDW9ZjMSR1EztapZfATCQqWCc5fXVJH2pE"      
  config.oauth_token = "205589709-5k8fy4FIQV87f6r3KkLGRDnewiU7GSj6ABMA6i2La84c"        
  config.oauth_token_secret = "LNARAeo386oN2vkklklPUrYf2dihQ5D8YYkm8dYvEs68M"  
end

###################################################################

# initialize OSC
#

# server not used yet
# @server = OSC::Server.new( 3332 )     # this is where I'm listening
@client = OSC::Client.new( 'localhost', 3333 )  # this is the target, ie a Max patch on this computer


# sit and wait by the window for tweets
# then send them off to Max

puts "send something from Twitter..."
twitterClient.user do |object|
  case object
  when Twitter::Tweet
    puts "It's a tweet!"
    puts object.text
    # send to Max
    @client.send( OSC::Message.new( "/tweet", ":#{object.text}" ))
  when Twitter::DirectMessage
    puts "It's a direct message!"
    puts object.text
#  this causes ruby error    
#  when Twitter::Streaming::StallWarning
#    warn "Falling behind!"

  end
end

