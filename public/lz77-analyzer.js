
/**
 * The code is based on https://github.com/whoughton/lz77
 */

export default class LZ77Analyzer {
  constructor(settings) {
    settings = settings || {};

    let defaultSettings = {
      minStringLength: 5,
      maxStringLength: undefined,
      windowLength: undefined
    };

    this.settings = Object.assign({}, defaultSettings, settings);
  }

  compress(source, callback) {
    let settings = this.settings;
    let pos = 0;
    let lastPos = source.length - settings.minStringLength;

    while (pos < lastPos) {
      let searchStart = Math.max(pos - settings.windowLength, 0);
      let matchLength = settings.minStringLength
      let foundMatch = false
      let bestMatch = {
        distance: null,
        length: 0
      };
      let isValidMatch;
      let realMatchLength;

      while ((searchStart + matchLength) < pos) {
        isValidMatch = ((source.substr(searchStart, matchLength) === source.substr(pos, matchLength)) && (matchLength < settings.maxStringLength));
        if (isValidMatch) {
          matchLength++;
          foundMatch = true;
        } else {
          realMatchLength = matchLength - 1;
          if (foundMatch && (realMatchLength > bestMatch.length)) {
            bestMatch.distance = pos - searchStart - realMatchLength;
            bestMatch.length = realMatchLength;
          }
          matchLength = settings.minStringLength;
          searchStart++;
          foundMatch = false;
        }
      }

      if (bestMatch.length) {
        callback(pos, bestMatch.length, bestMatch.distance);
        pos += bestMatch.length;
      } else {
        pos++;
      }
    }
  }
}
