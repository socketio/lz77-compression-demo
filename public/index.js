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
  constructor(props) {
    super(props);
    this.shouldScrollBottom = false;
  }

  componentWillUpdate() {
    let { container } = this.refs;
    this.shouldScrollBottom = !!container && container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  }

  componentDidUpdate() {
    let { container } = this.refs;
    if (container && this.shouldScrollBottom) {
      container.scrollTop = container.scrollHeight - container.clientHeight;
    }
  }

  render() {
    let { data } = this.props;

    data = data || 'Waiting for incoming data..';
    let html = htmlEscape(data)
      .replace(/###start\[(\d+)\]###/g, (_, length) => {
        let opacity = Math.min(parseInt(length, 10) / 20, 1);
        return '<span style="background:rgba(255,255,0,' + opacity + ')">';
      })
      .replace(/###end###/g, '</span>');

    return <pre ref="container" className="lz77" dangerouslySetInnerHTML={{ __html: html }} />;
  }
}

function htmlEscape(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

render(<App />, document.getElementById('app'));
