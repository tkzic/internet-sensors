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

#
# to get your twitter id, goto https://tweeterid.com/



#
#  updated variable names for tokens 1/22/2021
#
twitterClient = Twitter::Streaming::Client.new do |config|
  config.consumer_key = ""       
  config.consumer_secret = ""      
  config.access_token = ""       
  config.access_token_secret = ""  
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

# this filter : follow method was the only workaround I could find that would get tweets from
# particular twitter user. The number is the twitter-id
#
# you can put in a list of id's separated by commas
#

twitterClient.filter(follow: "205589709") do |tweet|
  puts "It's a tweet!"
  puts tweet.text
  # send to Max
  @client.send( OSC::Message.new( "/tweet", ":#{tweet.text}" ))
end


# this was the old way that stopped working in 2021


#twitterClient.user do |object|
#  case object
#  when Twitter::Tweet
#    puts "It's a tweet!"
#    puts object.text
#    # send to Max
#    @client.send( OSC::Message.new( "/tweet", ":#{object.text}" ))
#  when Twitter::DirectMessage
#    puts "It's a direct message!"
#    puts object.text
#
#  end
#end


puts "all done"

