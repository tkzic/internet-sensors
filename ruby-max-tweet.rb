#!/usr/bin/env ruby


# file: ruby-max-tweet.rb
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
require 'patron'
require 'json'

# replace these two strings with your feed number and apikey
#
feed = "myCosmFeedID"  # my cosm feed id for handling tweet triggers
apikey = 'myCosmAPI-KEY'  # my special api-key from cosm.com


# initialize http: request (patron)
#
sess = Patron::Session.new
sess.base_url = "http://api.cosm.com"
sess.headers['X-ApiKey'] = apikey
sess.timeout = 10
sess.enable_debug "./cosm.debug"


# initialize OSC
#
@server = OSC::Server.new( 3332 )     # this is where I'm listening
@client = OSC::Client.new( 'localhost', 3333 )  # this is the target, ie a Max patch on this computer


# add method to server which listens for tweet data from Max

@server.add_method '/tweet' do | message |
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console
  # format the json data with the tweet from Max
  jsonTweet = "{ \"id\":#{feed}, \"datastreams\":[{ \"current_value\":\"#{message.to_a}\", \"id\": \"tweet\"}]}"
  # send the tweet
  resp = sess.put("/v2/feeds/#{feed}.json", jsonTweet)
  # check for errors and display them to console
  response = "ok"
  if resp.status != 200      # if error
    response = resp.body    # get error message
  end
  # send an acknowledgement to Max
  @client.send( OSC::Message.new( "/response", "#{resp.status}:#{response}" ))
end

# fire up the server
Thread.new do
  @server.run
end

puts "waiting for tweets..."

# sleep for about a hundred years

sleep( 1000000 )

# this program ends will you kill it with ctrl-c
