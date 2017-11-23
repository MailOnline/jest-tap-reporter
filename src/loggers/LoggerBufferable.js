const Logger = require('./Logger');

/**
 * This logger can buffer multiple calls to .log() and then
 * flush them all at once to STDOUT. Useful for printing test
 * suite output all at once for some terminals.
 */
class LoggerBufferable extends Logger {
  constructor (...args) {
    super(...args);

    this.isBuffering = false;
    this.queue = '';
  }

  buffer () {
    this.isBuffering = true;
  }

  flush () {
    this.isBuffering = false;
    super.write(this.queue);
    this.queue = '';
  }

  push (data) {
    this.queue += data;
  }

  write (data) {
    if (this.isBuffering) {
      this.push(data);
    } else {
      super.write(data);
    }
  }
}

module.exports = LoggerBufferable;
