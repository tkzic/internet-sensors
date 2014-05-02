#!/usr/bin/env ruby


# file: ruby-max-tweet2.rb
#
# 9/2013 - this version uses oauth to communicate directly with twitter
# instead of using xively/zapier as intermediary
#
# this is a server that
# sends tweets from Max by receiving tweet-text from Max using Osc
# 
# maxpatch is ruby-max-tweet.maxpat
#
# receive osc messages in form of: /tweet message-string
#
# return /response with status code and error text
#

require 'rubygems'
require 'osc-ruby'
require 'json'
require 'twitter'

# authentication data from your registered read/write twitter app
# see dev.twitter.com/apps
#



Twitter.configure do |config|
  config.consumer_key = "mqQtoYh16Ro77wy3BK7QQ"       
  config.consumer_secret = "X0KexjlKBDW9ZjMSR1EztapZfATCQqWCc5fXVJH2pE"      
  config.oauth_token = "205589709-5k8fy4FIQVr3KkLGRDnewiU7GSj6ABMA6i2La84c"        
  config.oauth_token_secret = "LNARAeooN2vkklklPUrYf2dihQ5D8YYkm8dYvEs68M"  
end


# initialize OSC
#
@server = OSC::Server.new( 3332 )     # this is where I'm listening
@client = OSC::Client.new( 'localhost', 3333 )  # this is the target, ie a Max patch on this computer


# add method to server which listens for tweet data from Max

@server.add_method '/tweet' do | message |
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console
  # format the json data with the tweet from Max
  #jsonTweet = "{ \"id\":#{feed}, \"datastreams\":[{ \"current_value\":\"#{message.to_a}\", \"id\": \"tweet\"}]}"
  # send the tweet
  tweet = "#{message.to_a}"
  Twitter.update(tweet)
  
  # check for errors and display them to console
  response = "ok"
  
  # send an acknowledgement to Max
  @client.send( OSC::Message.new( "/response", ":#{response}" ))
end

# fire up the server
Thread.new do
  @server.run
end

puts "waiting for tweets..."

# sleep for about a hundred years

sleep( 1000000 )

# this program ends will you kill it with ctrl-c
