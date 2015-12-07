import io from 'socket.io-client';
import React from 'react';
import { render } from 'react-dom';

let worker = new Worker('/worker.bundle.js');

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tweets: [],
      data: ''
    };

    this.tweets = [];
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
        worker.postMessage(data);
        onData.call(transport, data);
      };
    });

    worker.onmessage = (e) => {
      this.setState({ data: e.data });
    };
  }

  render() {
    return <div className="container">
      <LZ77Visualizer key="lz77" data={this.state.data} />
      <Tweets tweets={this.state.tweets} />
    </div>;
  }
}

class LZ77Visualizer extends React.Component {
  render() {
    let { data } = this.props;

    let html = htmlEscape(data)
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
