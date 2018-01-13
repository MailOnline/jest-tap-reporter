/* eslint-disable complexity, no-use-extend-native/no-use-extend-native */
const path = require('path');
const chalk = require('chalk');
const bar = require('utf8-bar');
const padEnd = require('string.prototype.padend');
const formatComment = require('./format/formatComment');
const formatCodeFrame = require('./format/formatCodeFrame');
const formatStatsBar = require('./format/formatStatsBar');
const formatFailureMessageTraceLine = require('./format/formatFailureMessageTraceLine');

const REG_TRACE_LINE = /\s*(.+)\((.+):([0-9]+):([0-9]+)\)$/;
const REG_INTERNALS = /^(node_modules|internal|(\.\.\/)*\.nvm)\//;
const REG_AT_PATH = /^\s*at (\/[^:]+):([0-9]+):([0-9]+)\s*$/;
const REG_AT = /^\s*at/;
const REG_ERROR = /^\s*Error:\s*/;
const REG_RECEIVED = /^\s*Received:/;
const REG_EXPECTED = /^\s*Expected value to[^:]+:/;
const REG_DIFFERENCE = /^\s*Difference:/;

const MDASH = '\u2014';
const CIRCLE = '●';

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

  info (line) {
    this.logger.info(line);
  }

  blank () {
    this.info('');
  }

  comment (line) {
    this.info(formatComment(line));
  }

  commentBlock (str) {
    const lines = str.split('\n');

    for (const line of lines) {
      this.comment(line);
    }
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

  keyValue (key, value) {
    // eslint-disable-next-line no-use-extend-native/no-use-extend-native
    const keyFormatted = padEnd(key + ':', 12, ' ');

    this.comment(chalk`{bold ${keyFormatted}} ${value}`);
  }

  keyValueList (key, list) {
    let value = '';

    for (const item of list) {
      value += (value ? ', ' : '') + item;
    }

    this.keyValue(key, value);
  }

  stats (name, failed, skipped, passed, total) {
    const list = [];

    if (total) {
      const formattedBar = formatStatsBar(passed / total, Boolean(failed));

      list.push(formattedBar);

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
    const formattedStatsBar = formatStatsBar(percent, percent < 1 && !updated && !added);

    list.push(formattedStatsBar);

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

  skipped (title) {
    this.result(chalk`{yellow ok}`, chalk`{yellow #} {yellow.bold SKIP} {yellow ${title}}`);
  }

  getPathRelativeToRoot (filePath) {
    return path.relative(this.root, filePath);
  }

  formatFailureMessage (message, showInternalStackTraces) {
    const [firstLine, ...lines] = message.split('\n');
    const outputLines = [];
    let context = '';
    const whitespace = '  ';

    const push = (line) => {
      outputLines.push(line);
    };
    const pushTraceLine = (line) => push(chalk`    {grey ${line}}`);
    const pushTraceLineDim = (line) => pushTraceLine(chalk`{dim ${line}}`);
    const pushCodeFrameLine = (line) => push('        ' + line);

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
          push('Stack:');
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
            if (showInternalStackTraces) {
              pushTraceLineDim(formatFailureMessageTraceLine(description, relativeFilePath, row, column));
            }
          } else {
            pushTraceLine(formatFailureMessageTraceLine(description, relativeFilePath, row, column));

            const codeFrame = formatCodeFrame(file, row, column);

            if (codeFrame) {
              push('');
              codeFrame.split('\n').forEach((codeFrameLine) => pushCodeFrameLine(codeFrameLine));
              push('');
            }
          }
        } else {
          const atPathMatches = line.match(REG_AT_PATH);
          const pushMethod = internalsStarted ? pushTraceLineDim : pushTraceLine;

          if (atPathMatches) {
            const [, atPathPath, atPathRow, atPathColumn] = atPathMatches;

            if (!internalsStarted || showInternalStackTraces) {
              pushMethod(chalk`at {cyan ${this.getPathRelativeToRoot(atPathPath)}}:{bold ${atPathRow}}:{bold ${atPathColumn}}`);
            }
          } else {
            pushMethod(line);
          }
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (line.match(REG_RECEIVED)) {
          context = 'received';
          push('');
          push('Received:');
          push('');
        } else if (line.match(REG_EXPECTED)) {
          context = 'expected';
          push('Expected:');
          push('');
        } else if (line.match(REG_DIFFERENCE)) {
          context = 'difference';
          push('Difference:');
        } else {
          switch (context) {
          case 'expected':
          case 'received':
            push('  ' + line);
            break;
          case 'difference':
            push('    ' + line.trim());
            break;
          default:
            push(line);
          }
        }
      }
    }

    return outputLines.map((line) => formatComment(whitespace + line)).join('\n');
  }

  errors (messages, showInternalStackTraces) {
    if (!messages.length) {
      return;
    }

    const formattedMessages = messages.map((message) => this.formatFailureMessage(message, showInternalStackTraces)).join('\n');

    this.logger.error(formattedMessages);
  }

  suite (isFail, dir, base) {
    const label = isFail ? chalk`{reset.inverse.bold.red  FAIL }` : chalk`{reset.inverse.bold.green  PASS }`;

    this.comment(chalk`${label} {grey ${this.getPathRelativeToRoot(dir)}${path.sep}}{bold ${base}}`);
  }

  plan (count = this.counter) {
    if (this.planWritten) {
      throw new Error('TAP test plan can be written only once.');
    }

    this.logger.log(chalk`{reset.inverse 1..${count}}`);
    this.planWritten = true;
  }

  aggregatedResults (aggregatedResults, estimatedTime) {
    const snapshotResults = aggregatedResults.snapshot;
    const snapshotsAdded = snapshotResults.added;
    const snapshotsFailed = snapshotResults.unmatched;
    const snapshotsPassed = snapshotResults.matched;
    const snapshotsTotal = snapshotResults.total;
    const snapshotsUpdated = snapshotResults.updated;
    const suitesFailed = aggregatedResults.numFailedTestSuites;
    const suitesPassed = aggregatedResults.numPassedTestSuites;
    const suitesPending = aggregatedResults.numPendingTestSuites;
    const suitesTotal = aggregatedResults.numTotalTestSuites;
    const testsFailed = aggregatedResults.numFailedTests;
    const testsPassed = aggregatedResults.numPassedTests;
    const testsPending = aggregatedResults.numPendingTests;
    const testsTotal = aggregatedResults.numTotalTests;
    const startTime = aggregatedResults.startTime;

    this.stats('Test Suites', suitesFailed, suitesPending, suitesPassed, suitesTotal);
    this.stats('Tests', testsFailed, testsPending, testsPassed, testsTotal);
    if (snapshotsTotal) {
      this.snapshots(snapshotsFailed, snapshotsUpdated, snapshotsAdded, snapshotsPassed, snapshotsTotal);
    }

    const timeValue = `${((Date.now() - startTime) / 1e3).toFixed(3)}s` + (estimatedTime ? `, estimated ${estimatedTime}s` : '');

    this.keyValue('Time', timeValue);
  }

  timeProgressBar (percentage) {
    if (percentage > 1) {
      return;
    }

    const line = bar(this.logger.stream.columns, percentage);
    const lineFormatted = chalk`{grey.dim ${line}}`;

    this.logger.write(lineFormatted);
  }
}

module.exports = LineWriter;
