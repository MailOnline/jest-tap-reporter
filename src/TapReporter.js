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

class TapReporter {
  constructor (globalConfig = {}, options = {}) {
    const {logLevel = 'INFO'} = options;

    this._globalConfig = globalConfig;
    this._options = options;
    this._shouldFail = false;
    this._watch = this._globalConfig.watch;
    this.logger = new Logger({
      logLevel
    });
    this.counter = 0;
    this.logger.info(chalk`\n\n{hidden #} {green Starting...}`);
    this.onAssertionResult = this.onAssertionResult.bind(this);
  }

  formatFailureMessageTraceLine (line) {
    const matches = line.match(REG_TRACE_LINE);

    if (matches) {
      const [, description, file, row, column] = matches;

      return chalk`${description}({cyan ${file}}:{black.bold ${row}}:{black.bold ${column}})`;
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
    const formattedTitle = [...ancestorTitles, chalk`{rgb(80,80,80) ${title}}`].join(' › ');

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
      formattedLine = chalk`{yellow ok} {bgYellow.rgba(255,255,255) ${counter}} ${formattedTitle} {yellow # SKIP}`;
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
        chalk`{bgRed.bold.rgb(255,255,255)  FAIL }` :
        chalk`{bgGreen.bold.rgb(255,255,255)  PASS }`;
      const tapLine = chalk`${prefix}{hidden #} ${label} {grey ${dir}${path.sep}}{bold ${base}}`;

      this.logger.info(tapLine + '\n');
    }

    testResults.forEach(this.onAssertionResult);
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
      startTime
    } = results;
    const skippedTestSuites = numPendingTestSuites > 0 ? `${chalk.yellow(`${numPendingTestSuites} skipped`)}, ` : '';
    const skippedTests = numPendingTests > 0 ? `${chalk.yellow(`${numPendingTests} skipped`)}, ` : '';

    this._shouldFail = numFailedTestSuites > 0 || numFailedTests > 0;

    this.logger.info('\n');
    if (numFailedTestSuites > 0) {
      this.logger.info(`# testSuites: ${skippedTestSuites}${chalk.red(`${numFailedTestSuites} failed`)}, ${numTotalTestSuites} total`);
    } else {
      this.logger.info(`# testSuites: ${skippedTestSuites}${chalk.green(`${numPassedTestSuites} passed`)}, ${numTotalTestSuites} total`);
    }

    if (numFailedTests > 0) {
      this.logger.info(`# tests:      ${skippedTests}${chalk.red(`${numFailedTests} failed`)}, ${numTotalTests} total`);
    } else {
      this.logger.info(`# tests:      ${skippedTests}${chalk.green(`${numPassedTests} passed`)}, ${numTotalTests} total`);
    }

    this.logger.info(`# time:       ${ms(Date.now() - startTime)}`);
    this.logger.info('\n');

    this.counter = 0;
  }

  getLastError () {
    if (this._shouldFail) {
      return new Error('TAP Reporter: failing tests found');
    }

    return undefined;
  }
}

module.exports = TapReporter;
