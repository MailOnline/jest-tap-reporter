/* eslint-disable id-match, class-methods-use-this, no-console */
const path = require('path');
const chalk = require('chalk');
const ms = require('ms');
const Logger = require('./helpers/Logger');

const STATUS_PASSED = 'passed';
const STATUS_FAILED = 'failed';
const STATUS_PENDING = 'pending';

const REG_TRACE_LINE = /\s*(.+)\((.+):([0-9]+):([0-9]+)\)$/;
const MDASH = '\u2014';

class PrettyLineWriter {
  constructor (logger) {
    this.logger = logger;
  }

  blank () {
    this.logger.info('\n');
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
}

class TapReporter {
  constructor (globalConfig = {}, options = {}) {
    console.log(globalConfig);
    const {logLevel = 'INFO'} = options;

    this._globalConfig = globalConfig;
    this._options = options;
    this._shouldFail = false;
    this._watch = this._globalConfig.watch;
    this.logger = new Logger({
      logLevel
    });
    this.line = new PrettyLineWriter(this.logger);
    this.counter = 0;
    this.onAssertionResult = this.onAssertionResult.bind(this);

    this.line.blank();
    this.line.comment(chalk`{green Starting...}`);
  }

  pathRelativeToRoot (filePath) {
    return path.relative(this._globalConfig.rootDir, filePath);
  }

  formatFailureMessageTraceLine (line) {
    const matches = line.match(REG_TRACE_LINE);

    if (matches) {
      const [, description, file, row, column] = matches;

      return chalk`${description}({cyan ${this.pathRelativeToRoot(file)}}:{black.bold ${row}}:{black.bold ${column}})`;
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

  formatFailureMessages (messages) {
    return messages.map((message) => this.formatFailureMessage(message)).join('\n');
  }

  onAssertionResult (assertiontResult) {
    this.counter += 1;
    const {counter} = this;
    const {ancestorTitles, duration, failureMessages, location, numPassingAsserts, title, status} = assertiontResult;

    let formattedTitle = status === STATUS_FAILED ?
      chalk`{red ${title}}` :
      chalk`{rgb(80,80,80) ${title}}`;

    formattedTitle = [...ancestorTitles, formattedTitle].join(' › ');

    let formattedLine;
    let formattedDiagnostics;

    switch (status) {
    case STATUS_PASSED:
      if (!this._watch) {
        formattedLine = chalk`{green ok} {grey.dim ${counter}} ${MDASH} ${formattedTitle}`;
      }
      break;
    case STATUS_FAILED:
      formattedLine = chalk`{red not ok} {grey.dim ${counter}} {red.bold ● ${formattedTitle}}`;
      formattedDiagnostics = this.formatFailureMessages(failureMessages);
      break;
    case STATUS_PENDING:
      formattedLine = chalk`{yellow ok} {grey.dim ${counter}} {yellow #} {yellow.bold TODO} ${formattedTitle}`;
      formattedDiagnostics = this.formatFailureMessages(failureMessages);
      break;
    default:
      formattedLine = chalk`{italic # Unknown status: ${status}}`;
    }

    this.logger.log(formattedLine);
    if (formattedDiagnostics) {
      this.logger.error(formattedDiagnostics);
    }
  }

  onTestResult (contexts, suite) {
    const {testResults, testFilePath, numFailingTests} = suite;

    if (testFilePath) {
      const {dir, base} = path.parse(testFilePath);
      const prefix = this._watch ? '' : '\n';
      const label = numFailingTests > 0 ?
        chalk`{bgRed.rgb(255,255,255).bold  FAIL }` :
        chalk`{bgGreen.rgb(255,255,255).bold  PASS }`;
      const tapLine = chalk`${prefix}{hidden #} ${label} {grey ${this.pathRelativeToRoot(dir)}${path.sep}}{bold ${base}}`;

      this.logger.info(tapLine + '\n');
    }

    testResults.forEach(this.onAssertionResult);
  }

  onRunStart (results, options) {
    this.onRunStartResults = results;
    this.onRunStartOptions = options;
  }

  onRunComplete (contexts, results) {
    const {
      numFailedTestSuites,
      numFailedTests,
      numPassedTestSuites,
      numPassedTests,
      numPendingTestSuites,
      numPendingTests,
      numTotalTestSuites,
      numTotalTests,
      snapshot,
      startTime
    } = results;

    const {estimatedTime} = this.onRunStartOptions;

    this._shouldFail = numFailedTestSuites > 0 || numFailedTests > 0;

    this.line.blank();
    this.line.stats('Test Suites', numFailedTestSuites, numPendingTestSuites, numPassedTestSuites, numTotalTestSuites);
    this.line.stats('Tests', numFailedTests, numPendingTests, numPassedTests, numTotalTests);
    this.line.stats('Snapshots', snapshot.total - snapshot.matched, 0, snapshot.matched, snapshot.total);
    this.line.keyValue('Time', `${((Date.now() - startTime) / 1e3).toFixed(3)}s, estimated ${estimatedTime}s`);
    this.line.commentLight('Ran all test suites.');
    this.line.blank();
  }

  getLastError () {
    if (this._shouldFail) {
      return new Error('TAP Reporter: failing tests found');
    }

    return undefined;
  }
}

module.exports = TapReporter;
