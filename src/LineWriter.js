const path = require('path');
const chalk = require('chalk');

const REG_TRACE_LINE = /\s*(.+)\((.+):([0-9]+):([0-9]+)\)$/;
const MDASH = '\u2014';
const CIRCLE = '●';

class LineWriter {
  constructor (logger, root) {
    this.counter = 0;
    this.logger = logger;
    this.root = root;
  }

  getNextNumber () {
    this.counter++;

    return this.counter;
  }

  blank () {
    this.logger.info('');
  }

  comment (line) {
    this.logger.info(chalk`{hidden #} ${line}`);
  }

  commentLight (line) {
    this.comment(chalk`{dim ${line}}`);
  }

  keyValue (key, value) {
    // eslint-disable-next-line no-use-extend-native/no-use-extend-native
    const keyFormatted = (key + ':').padEnd(12, ' ');

    this.comment(chalk`{black.bold ${keyFormatted}} ${value}`);
  }

  stats (name, failed, skipped, passed, total) {
    let value = '';

    if (total) {
      value += chalk`{red.bold ${failed} failed}`;

      if (skipped) {
        value += chalk`, {yellow.bold ${skipped} skipped}`;
      }

      value += chalk`, {green.bold ${passed} passed}`;
    }

    value += `${total ? ', ' : ''}${total} total`;

    this.keyValue(name, value);
  }

  result (label, title) {
    this.logger.log(label + chalk` {grey.dim ${this.getNextNumber()}} ${title}`);
  }

  passed (title) {
    this.result(chalk`{green ok}`, `${MDASH} ${title}`);
  }

  failed (title) {
    this.result(chalk`{red not ok}`, chalk`{red.bold ${CIRCLE} ${title}}`);
  }

  pending (title) {
    this.result(chalk`{yellow ok}`, chalk`{yellow #} {yellow.bold TODO} ${title}`);
  }

  getPathRelativeToRoot (filePath) {
    return path.relative(this.root, filePath);
  }

  formatFailureMessageTraceLine (line) {
    const matches = line.match(REG_TRACE_LINE);

    if (matches) {
      const [, description, file, row, column] = matches;

      return chalk`${description}({cyan ${this.getPathRelativeToRoot(file)}}:{black.bold ${row}}:{black.bold ${column}})`;
    } else {
      return line;
    }
  }

  formatFailureMessage (message) {
    const [firstLine, ...lines] = message.split('\n');
    const formattedLines = [];
    const whitespace = ' '.repeat(9 + String(this.counter).length);

    const push = (line) => {
      const formattedLine = chalk`{hidden #}${whitespace}${line}`;

      formattedLines.push(formattedLine);
    };

    const pushTraceLine = (line) => {
      push(chalk`  {grey ${line}}`);
    };

    push('');
    push(firstLine);
    push('');

    for (const line of lines) {
      pushTraceLine(this.formatFailureMessageTraceLine(line));
    }

    push('');

    return formattedLines.join('\n');
  }

  errors (messages) {
    if (!messages.length) {
      return;
    }

    const formattedMessages = messages.map((message) => this.formatFailureMessage(message)).join('\n');

    this.logger.error(formattedMessages);
  }
}

module.exports = LineWriter;
