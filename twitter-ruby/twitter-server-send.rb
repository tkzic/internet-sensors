#!/usr/bin/env ruby


# file: twitter-server-send.rb
#
# updated 11/26/2013 for latest version of twitter gem
#
# 9/2013 - this version uses oauth to communicate directly with twitter
# instead of xively/zapier as intermediary
#
# this is a server that
# sends tweets from Max by receiving tweet-text from Max using Osc
# 
# maxpatch is twitter-client.maxpat
#
# receives: osc messages in form of: /tweet message-string
# returns: /response with tweet id or error text 
#

# note: you will need to install these ruby GEMS:
#
# osc-ruby
# json
# twitter
#
# for example: # sudo gem install osc-ruby
#

require 'rubygems'
require 'osc-ruby'
require 'json'
require 'twitter'

# authentication data from your registered read/write twitter app
#
# YOU WILL NEED TO EDIT THIS DATA - replacing with your own - inside the quote marks
#
# see dev.twitter.com/apps
#



twitterClient = Twitter::REST::Client.new do |config|
# Twitter.configure do |config|
  config.consumer_key = "mqQtoYh16dfgRo77wy3BK7QQ"       
  config.consumer_secret = "X0KexjldfgKBDW9ZjMSR1EztapZfATCQqWCc5fXVJH2pE"      
  config.oauth_token = "205589709-5k8f654y4FIQVr3KkLGRDnewiU7GSj6ABMA6i2La84c"        
  config.oauth_token_secret = "LNARAeooN2vkkl765klPUrYf2dihQ5D8YYkm8dYvEs68M"  
end

###################################################################

# initialize OSC
#
@server = OSC::Server.new( 3332 )     # this is where I'm listening
@client = OSC::Client.new( 'localhost', 3333 )  # this is the target, ie a Max patch on this computer


# add method to server which listens for tweet data from Max

@server.add_method '/tweet' do | message |
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console

  tweetText = "#{message.to_a}"
  tweetText = tweetText[2..(tweetText.length - 3)]  # strip out brackets and quotes from Max
  
  
  begin
    # send the tweet
    # tweet = Twitter.update(tweetText)
    tweet = twitterClient.update(tweetText)
    response = tweet.id
  rescue Twitter::Error::Unauthorized => error
    response = "unauthorized"
  rescue Twitter::Error::Forbidden => error
    response = "forbidden (is this a duplicate tweet?)"  
  end
  
  puts "response: #{response} " 
  
  # look at the object
  # puts tweet.inspect
  
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
