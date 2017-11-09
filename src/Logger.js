/* eslint-disable sort-keys */
const LEVELS = {
  ERROR: 1,
  WARN: 2,
  INFO: 3
};
/* eslint-enable sort-keys */

// eslint-disable-next-line no-console
const DEFAULT_LOG = console.log;
const sLevel = Symbol('level');

class Logger {
  constructor ({log = DEFAULT_LOG, logLevel = 'INFO'} = {}) {
    this.log = log;
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
