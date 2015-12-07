# LZ77 Compression Demo

A demo which hightlishgts the compressed texts by LZ77 algorithm a realtime stream on Twitter.

## How to use
Please prepare a [Twitter access token](https://dev.twitter.com/oauth/application-only).

### Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

### Custom
Set the environment variables and start your server.

```sh
$ cat .env
TWITTER_CONSUMER_KEY=xxxxxxxxxx
TWITTER_CONSUMER_SECRET=xxxxxxxxxx
TWITTER_TOKEN=xxxxxxxxxx
TWITTER_TOKEN_SECRET=xxxxxxxxxx
$ npm install
$ env $(cat .env | xargs) npm start
```

## License

MIT
