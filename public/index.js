import io from 'socket.io-client';
import React from 'react';
import { render } from 'react-dom';
import LZ77Analyzer from './lz77-analyzer';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tweets: [],
      data: []
    };

    this.tweets = [];
    this.data = [];
  }

  componentWillMount() {
    let socket = io();
    socket.on('tweets', (tweets) => {
      this.tweets = tweets;
      this.setState({ tweets });
    });
    socket.on('tweet', (tweet) => {
      let tweets = this.tweets = [tweet].concat(this.tweets).slice(0, 10);
      this.setState({ tweets });
    });

    socket.io.engine.on('upgrade', (transport) => {
      let onData = transport.onData;
      transport.onData = (data) => {
        if (data.length < 1024) return;

        this.data.push(data);
        while (this.data.slice(1).join('').length > 1 << 15) {
          this.data.shift();
        }
        setTimeout(() => {
          this.setState({ data: this.data });
        }, 0);
        onData.call(transport, data);
      };
    });
  }

  render() {
    return <div className="container">
      <LZ77Visualizer key="lz77" data={this.state.data} />
      <Tweets tweets={this.state.tweets} />
    </div>;
  }
}

class LZ77Visualizer extends React.Component {
  constructor(props) {
    super(props);

    this.lz77 = new LZ77Analyzer({
      minStringLength: 3,
      maxStringLength: 258,
      windowLength: 1 << 15
    });
  }

  render() {
    let { data } = this.props;

    let mappings = {};

    this.lz77.compress(data.join(''), function(pos, len, distance) {
      let start = mappings[pos] = mappings[pos] || [];
      start.push({ type: 'start', length: len });

      let endPos = pos + len;
      let end = mappings[endPos] = mappings[endPos] || [];
      end.push({ type: 'end', length: len });
    });

    let source = data.map((d) => {
      return d.slice(0, 2) + '\n' + JSON.stringify(JSON.parse(d.slice(2)), null, 2);
    }).join('\n');
    let pos = 0;
    let cursor = 0;

    Object.keys(mappings).forEach((p) => {
      while (pos < p) {
        let c = source[cursor];
        switch (c) {
          case '\n':
            while (source[++cursor] == ' ');
            cursor--;
            break;
          case ':':
            if (source.substr(cursor - 1, 3) == '": ') cursor++;
            pos++;
            break;
          default:
            pos++;
            break;
        }
        cursor++;
      }

      // check next
      let c = source[cursor];
      switch (c) {
        case '\n':
          while (source[++cursor] == ' ');
          break;
        case ':':
          if (source.substr(cursor - 1, 3) == '": ') cursor++;
          break;
      }

      let mapping = mappings[p];
      mapping.forEach((m) => {
        let marker;
        switch (m.type) {
          case 'start':
            marker = '###start[' + m.length + ']###';
            break;
          case 'end':
            marker = '###end###';
            break;
          default:
            throw new Error('Unexpected type: ' + m.type);
        }
        source = source.slice(0, cursor) + marker + source.slice(cursor);
        cursor += marker.length;
      });
    });

    let html = htmlEscape(source)
      .replace(/###start\[(\d+)\]###/g, (_, length) => {
        let opacity = Math.min(parseInt(length, 10) / 20, 1);
        return '<span style="background:rgba(255,255,0,' + opacity + ')">';
      })
      .replace(/###end###/g, '</span>');

    return <pre dangerouslySetInnerHTML={{ __html: html }} />;
  }
}

class Tweets extends React.Component {
  render() {
    let { tweets } = this.props;

    return <ul className="tweets">
      {tweets.map((tweet) => {
        let url = `https:///twitter.com/${encodeURIComponent(tweet.user.screen_name)}/status/${encodeURIComponent(tweet.id_str)}`;

        return <li key={tweet.id} className="tweet">
          <a className="wrapper" href={url} target="_blank">
            <div className="profile-image">
              <img src={tweet.user.profile_image_url}/>
            </div>
            <div className="content">
              <h3 className="name">{tweet.user.name}</h3>
              <p className="text">{tweet.text}</p>
            </div>
          </a>
        </li>
      })}
    </ul>;
  }
}

function htmlEscape(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

render(<App />, document.getElementById('app'));
