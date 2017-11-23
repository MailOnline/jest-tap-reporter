const LoggerBufferable = require('./LoggerBufferable');

const getLineCount = (str) => {
  let count = 1;
  let pos = -1;

  while ((pos = str.indexOf('\n', pos + 1)) > -1) {
    count++;
  }

  return count;
};

/**
 * This logger allows to print temporary output at the very bottom
 * that will be erased and overwritten on the next call to .log().
 * Used when showing temporary progress when streaming test suite results.
 */
class LoggerTemporal extends LoggerBufferable {
  constructor (...args) {
    super(...args);

    this.linesToErase = 0;
    this.isTemporary = false;
    this.queueTemporary = '';
  }

  temporary () {
    if (!this.isBuffering) {
      throw new Error('You need to call .buffer() before .temporary().');
    }
    this.isTemporary = true;
  }

  push (data) {
    if (this.isTemporary) {
      this.queueTemporary += data;
    } else {
      super.push(data);
    }
  }

  flush () {
    super.flush();

    this.write(this.queueTemporary);
    this.linesToErase = getLineCount(this.queueTemporary) - 1;

    this.queueTemporary = '';
    this.isTemporary = false;
  }

  write (data) {
    const {stream} = this;

    if (this.linesToErase && stream.moveCursor) {
      for (let index = 0; index < this.linesToErase; index++) {
        stream.cursorTo(0);
        stream.clearLine();
        stream.moveCursor(0, -1);
      }

      this.linesToErase = 0;
    }

    super.write(data);
  }
}

module.exports = LoggerTemporal;
