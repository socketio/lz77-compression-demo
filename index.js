import http from 'http';
import path from 'path';
import express from 'express';
import socketio from 'socket.io';
import tweetStream from 'node-tweet-stream';
import dbg from 'debug';

const PORT = process.env.PORT || 3000;

let debug = dbg('lz77-compression-demo');
let app = express();
let server = http.createServer(app);
let io = socketio(server);
let tw = tweetStream({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  token: process.env.TWITTER_TOKEN,
  token_secret: process.env.TWITTER_TOKEN_SECRET
});
let tweets = [];

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  socket.emit('tweets', tweets);
});

tw.track('socket.io');
tw.track('javascript');
tw.on('tweet', (tweet) => {
  debug('a new tweet: %s %s', tweet.user.name, tweet.text);

  if (/socket\.io/i.test(tweet.text)) {
    tweets.unshift(tweet);
    tweets = tweets.slice(0, 10);
  }

  io.emit('tweet', tweet);
});

server.listen(PORT, () => {
  console.log('Server listening at port %d', PORT);
});

