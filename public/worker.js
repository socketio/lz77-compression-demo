import LZ77Analyzer from './lz77-analyzer';

let lz77 = new LZ77Analyzer({
  minStringLength: 3,
  maxStringLength: 258,
  windowLength: 1 << 15
});
let data = [];

onmessage = (e) => {
  if (e.data.length < 1024) return;

  data.push(e.data);
  while (data.slice(1).join('').length > 1 << 15) {
    data.shift();
  }

  let marked = mark(data);
  postMessage(marked);
};

function mark(data) {
  let mappings = {};

  lz77.compress(data.join(''), (pos, len, distance) => {
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

  return source;
}
