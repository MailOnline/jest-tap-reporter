const formatLog = require('../format/formatLog');

/* eslint-disable sort-keys */
const LEVELS = {
  ERROR: 1,
  WARN: 2,
  INFO: 3
};
/* eslint-enable sort-keys */

const sLevel = Symbol('level');

class Logger {
  constructor ({
    logLevel = 'INFO',
    stream = process.stdout
  } = {}) {
    this.stream = stream;
    this.setLevel(logLevel);
  }

  setLevel (levelName) {
    if (typeof levelName !== 'string') {
      throw new TypeError('Level must be a string');
    }

    if (!LEVELS[levelName]) {
      throw new Error('Unknown level');
    }

    this[sLevel] = LEVELS[levelName];
  }

  getLevel () {
    return Object.keys(LEVELS).filter((key) => LEVELS[key] === this[sLevel])[0];
  }

  write (data) {
    this.stream.write(data);
  }

  log (...args) {
    this.write(formatLog(...args) + '\n');
  }

  info (...args) {
    if (this[sLevel] >= LEVELS.INFO) {
      this.log(...args);
    }
  }

  warn (...args) {
    if (this[sLevel] >= LEVELS.WARN) {
      this.log(...args);
    }
  }

  error (...args) {
    if (this[sLevel] >= LEVELS.ERROR) {
      this.log(...args);
    }
  }
}

module.exports = Logger;
