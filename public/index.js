import io from 'socket.io-client';
import React from 'react';
import { render } from 'react-dom';

let worker = new Worker('/worker.bundle.js');

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: '' };
  }

  componentWillMount() {
    let socket = io();
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

function htmlEscape(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

render(<App />, document.getElementById('app'));
