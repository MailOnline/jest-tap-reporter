const path = require('path');
const chalk = require('chalk');
const progressBar = require('./progressBar');

const REG_TRACE_LINE = /\s*(.+)\((.+):([0-9]+):([0-9]+)\)$/;
const REG_INTERNALS = /^(node_modules|internal)\//;
const REG_AT = /^\s*at/;
const REG_ERROR = /^\s*Error:\s*/;

const MDASH = '\u2014';
const CIRCLE = '●';

const FAIL_TEXT = 'FAIL';
const PASS_TEXT = 'PASS';

const FAIL = chalk.supportsColor ?
  chalk`{reset.inverse.bold.red  ${FAIL_TEXT} }` :
  ` ${FAIL_TEXT} `;

const PASS = chalk.supportsColor ?
  chalk`{reset.inverse.bold.green  ${PASS_TEXT} }` :
  ` ${PASS_TEXT} `;

const formatComment = (line) => chalk`{hidden #} ${line}`;
const formatFailureMessageTraceLine = (description, relativeFilePath, row, column) =>
  chalk`${description}({cyan ${relativeFilePath}}:{black.bold ${row}}:{black.bold ${column}})`;
const formatStatsBar = (percent, hasErrors) => {
  // eslint-disable-next-line no-use-extend-native/no-use-extend-native
  const percentFormatted = (Math.round(100 * percent) + '%').padStart(3, ' ').padEnd(4, ' ');
  const bar = progressBar(percent, hasErrors ? 'red' : 'grey.dim');

  let textStyles = 'green';

  if (hasErrors) {
    textStyles = 'red.bold';
  } else if (percent < 1) {
    textStyles = 'yellow';
  }

  return chalk`{${textStyles} ${percentFormatted}} ${bar}`;
};

class LineWriter {
  constructor (logger, root) {
    this.counter = 0;
    this.logger = logger;
    this.root = root;
    this.planWritten = false;
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

  start (numSuites) {
    this.blank();
    this.blank();
    this.comment(chalk`{green Starting...}`);

    if (numSuites) {
      this.commentLight(`${numSuites} test suites found.`);
    }
  }

  commentLight (line) {
    this.comment(chalk`{dim ${line}}`);
  }

  keyValue (key, value, prefix = '') {
    // eslint-disable-next-line no-use-extend-native/no-use-extend-native
    const keyFormatted = (key + ':').padEnd(12, ' ');

    this.comment(chalk`${prefix}{bold ${keyFormatted}} ${value}`);
  }

  keyValueList (key, list, prefix = '') {
    let value = '';

    for (const item of list) {
      value += (value ? ', ' : '') + item;
    }

    this.keyValue(key, value, prefix);
  }

  stats (name, failed, skipped, passed, total) {
    const list = [];

    if (total) {
      const bar = formatStatsBar(passed / total, passed + skipped < total);

      list.push(bar);

      if (failed) {
        list.push(chalk`{red.bold ${failed} failed}`);
      }

      if (skipped) {
        list.push(chalk`{yellow.bold ${skipped} skipped}`);
      }

      if (passed) {
        list.push(chalk`{green.bold ${passed} passed}`);
      }
    }

    list.push(chalk`{reset ${total} total}`);

    this.keyValueList(name, list);
  }

  snapshots (failed, updated, added, passed, total) {
    if (!total) {
      return;
    }

    const list = [];

    const percent = passed / total;
    const bar = formatStatsBar(percent, percent < 1 && !updated);

    list.push(bar);

    if (failed) {
      list.push(chalk`{red.bold ${failed} failed}`);
    }

    if (updated) {
      list.push(chalk`{yellow.bold ${updated} updated}`);
    }

    if (added) {
      list.push(chalk`{green.bold ${added} added}`);
    }

    if (passed) {
      list.push(chalk`{green.bold ${passed} passed}`);
    }

    list.push(chalk`{reset ${total} total}`);

    this.keyValueList('Snapshots', list);
  }

  result (okNotOK, title) {
    this.logger.log(okNotOK + chalk` {grey.dim ${this.getNextNumber()}} ${title}`);
  }

  passed (title) {
    this.result(chalk`{green ok}`, title ? `${MDASH} ${title}` : '');
  }

  failed (title) {
    this.result(chalk`{red not ok}`, chalk`{red.bold ${CIRCLE} ${title}}`);
  }

  pending (title) {
    this.result(chalk`{yellow ok}`, chalk`{yellow #} {yellow.bold SKIP} ${title}`);
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
    const label = isFail ? FAIL : PASS;

    this.comment(chalk`${label} {grey ${this.getPathRelativeToRoot(dir)}${path.sep}}{bold ${base}}`);
  }

  plan (count = this.counter) {
    if (this.planWritten) {
      throw new Error('TAP test plan can be written only once.');
    }

    this.logger.log(chalk`{reset.inverse 1..${count}}`);
    this.planWritten = true;
  }
}

module.exports = LineWriter;
