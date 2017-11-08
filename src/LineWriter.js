const path = require('path');
const chalk = require('chalk');

const REG_TRACE_LINE = /\s*(.+)\((.+):([0-9]+):([0-9]+)\)$/;
const REG_INTERNALS = /^(node_modules|internal)\//;
const REG_AT = /^\s*at/;
const REG_ERROR = /^\s*Error:\s*/;

const MDASH = '\u2014';
const CIRCLE = '●';

const formatComment = (line) => chalk`{hidden #} ${line}`;
const formatFailureMessageTraceLine = (description, relativeFilePath, row, column) =>
  chalk`${description}({cyan ${relativeFilePath}}:{black.bold ${row}}:{black.bold ${column}})`;

class LineWriter {
  constructor (logger, root) {
    this.counter = 0;
    this.logger = logger;
    this.root = root;
  }

  start () {
    this.blank();
    this.blank();
    this.comment(chalk`{green Starting...}`);
  }

  getNextNumber () {
    this.counter++;

    return this.counter;
  }

  blank () {
    this.logger.info('');
  }

  comment (line) {
    this.logger.info(formatComment(line));
  }

  commentLight (line) {
    this.comment(chalk`{dim ${line}}`);
  }

  keyValue (key, value) {
    // eslint-disable-next-line no-use-extend-native/no-use-extend-native
    const keyFormatted = (key + ':').padEnd(12, ' ');

    this.comment(chalk`{black.bold ${keyFormatted}} ${value}`);
  }

  stats (name, failed, skipped, passed, total, names = {
    failed: 'failed',
    passed: 'passed',
    skipped: 'skipped',
    total: 'total'
  }) {
    let value = '';

    if (total) {
      if (failed) {
        value += (value ? ', ' : '') + chalk`{red.bold ${failed} ${names.failed}}`;
      }

      if (skipped) {
        value += (value ? ', ' : '') + chalk`{yellow.bold ${skipped} ${names.skipped}}`;
      }

      value += (value ? ', ' : '') + chalk`{green.bold ${passed} ${names.passed}}`;
    }

    value += `${total ? ', ' : ''}${total} ${names.total}`;

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

  formatFailureMessage (message) {
    const [firstLine, ...lines] = message.split('\n');
    const outputLines = [];
    const whitespace = '  ';

    const push = (line) => {
      outputLines.push(line);
    };
    const pushTraceLine = (line) => push(chalk`    {grey ${line}}`);
    const pushTraceLineDim = (line) => pushTraceLine(chalk`{dim ${line}}`);

    let firstLineFormatted = firstLine;

    // Remove leading `Error: `
    firstLineFormatted = firstLineFormatted.replace(REG_ERROR, '');

    push('');
    push(firstLineFormatted);
    push('');

    let internalsStarted = false;
    let isFirstTraceLine = true;

    for (const line of lines) {
      if (line.match(REG_AT)) {
        if (isFirstTraceLine) {
          isFirstTraceLine = false;

          const isLastLineBlank = outputLines[outputLines.length - 1] === '';

          if (!isLastLineBlank) {
            push('');
          }
          push(chalk`{bold.dim Stack trace:}`);
          push('');
        }

        const matches = line.match(REG_TRACE_LINE);

        if (matches) {
          const [, description, file, row, column] = matches;
          const relativeFilePath = path.relative(this.root, file);

          if (relativeFilePath.match(REG_INTERNALS)) {
            internalsStarted = true;
          }

          // eslint-disable-next-line no-lonely-if
          if (internalsStarted) {
            pushTraceLineDim(formatFailureMessageTraceLine(description, relativeFilePath, row, column));
          } else {
            pushTraceLine(formatFailureMessageTraceLine(description, relativeFilePath, row, column));
          }
        } else {
          pushTraceLine(line);
        }
      } else {
        push(line);
      }
    }

    push('');

    return outputLines.map((line) => formatComment(whitespace + line)).join('\n');
  }

  errors (messages) {
    if (!messages.length) {
      return;
    }

    const formattedMessages = messages.map((message) => this.formatFailureMessage(message)).join('\n');

    this.logger.error(formattedMessages);
  }

  suite (isFail, dir, base) {
    const label = isFail ?
      chalk`{bgRed.rgb(255,255,255).bold  FAIL }` :
      chalk`{bgGreen.rgb(255,255,255).bold  PASS }`;

    this.comment(chalk`${label} {grey ${this.getPathRelativeToRoot(dir)}${path.sep}}{bold ${base}}`);
  }

  plan (count = this.counter) {
    this.logger.log(chalk`{bgBlack.rgb(255,255,255) 1..${count}}`);
  }
}

module.exports = LineWriter;
