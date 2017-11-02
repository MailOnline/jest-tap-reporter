/* eslint-disable sort-keys */
const LEVELS = {
  ERROR: 1,
  WARN: 2,
  INFO: 3
};
/* eslint-enable sort-keys */

// eslint-disable-next-line no-console
const DEFAULT_LOG = (...args) => console.log(...args);
const level = Symbol('level');

class Logger {
  constructor ({log = DEFAULT_LOG, logLevel} = {}) {
    this.log = log;
    this.setLevel(logLevel || 'INFO');
  }

  setLevel (newLevel) {
    if (typeof LEVELS[newLevel] === 'undefined') {
      throw new TypeError('Unknown level');
    }

    this[level] = LEVELS[newLevel];
  }

  getLevel () {
    return Object.keys(LEVELS).filter((key) => LEVELS[key] === this[level])[0];
  }

  info (...args) {
    if (this[level] >= LEVELS.INFO) {
      this.log(...args);
    }
  }

  warn (...args) {
    if (this[level] >= LEVELS.WARN) {
      this.log(...args);
    }
  }

  error (...args) {
    if (this[level] >= LEVELS.ERROR) {
      this.log(...args);
    }
  }

  log (...args) {
    this.log(...args);
  }
}

module.exports = Logger;
