/* eslint-disable id-match, class-methods-use-this, no-console */
const path = require('path');
const chalk = require('chalk');
const Logger = require('./Logger');
const LineWriter = require('./LineWriter');

const STATUS_PASSED = 'passed';
const STATUS_FAILED = 'failed';
const STATUS_PENDING = 'pending';

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
    this.writer = new LineWriter(this.logger, globalConfig.rootDir);
    this.onAssertionResult = this.onAssertionResult.bind(this);

    this.writer.blank();
    this.writer.blank();
    this.writer.comment(chalk`{green Starting...}`);
  }

  pathRelativeToRoot (filePath) {
    return path.relative(this._globalConfig.rootDir, filePath);
  }

  onAssertionResult (assertiontResult) {
    const {ancestorTitles, duration, failureMessages, location, numPassingAsserts, title, status} = assertiontResult;

    let formattedTitle = status === STATUS_FAILED ?
      chalk`{red ${title}}` :
      chalk`{rgb(80,80,80) ${title}}`;

    formattedTitle = [...ancestorTitles, formattedTitle].join(' › ');

    switch (status) {
    case STATUS_PASSED:
      if (!this._watch) {
        this.writer.passed(formattedTitle);
      }
      break;
    case STATUS_FAILED:
      this.writer.failed(formattedTitle);
      this.writer.errors(failureMessages);
      break;
    case STATUS_PENDING:
      this.writer.pending(formattedTitle);
      this.writer.errors(failureMessages);
      break;
    default:
      this.commentLight(chalk`{italic Unknown status: ${status}}`);
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

    this.writer.blank();
    this.writer.stats('Test Suites', numFailedTestSuites, numPendingTestSuites, numPassedTestSuites, numTotalTestSuites);
    this.writer.stats('Tests', numFailedTests, numPendingTests, numPassedTests, numTotalTests);
    this.writer.stats('Snapshots', snapshot.total - snapshot.matched, 0, snapshot.matched, snapshot.total);
    this.writer.keyValue('Time', `${((Date.now() - startTime) / 1e3).toFixed(3)}s, estimated ${estimatedTime}s`);
    this.writer.commentLight('Ran all test suites.');
    this.writer.blank();
  }

  getLastError () {
    if (this._shouldFail) {
      return new Error('TAP Reporter: failing tests found');
    }

    return undefined;
  }
}

module.exports = TapReporter;
