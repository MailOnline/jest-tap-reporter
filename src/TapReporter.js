/* eslint-disable id-match, class-methods-use-this, no-console */
const path = require('path');
const chalk = require('chalk');
const Logger = require('./Logger');
const LineWriter = require('./LineWriter');

const STATUS_PASSED = 'passed';
const STATUS_FAILED = 'failed';
const STATUS_PENDING = 'pending';

const sShouldFail = Symbol('shouldFail');

class TapReporter {
  constructor (globalConfig = {}, options = {}) {
    const {logLevel = 'INFO'} = options;

    this.globalConfig = globalConfig;
    this.options = options;
    this[sShouldFail] = false;
    this.logger = new Logger({logLevel});
    this.writer = new LineWriter(this.logger, globalConfig.rootDir);
    this.onAssertionResult = this.onAssertionResult.bind(this);

    this.onRunStartResults = {};
    this.onRunStartOptions = {};

    this.writer.start();
  }

  pathRelativeToRoot (filePath) {
    return path.relative(this.globalConfig.rootDir, filePath);
  }

  onAssertionResult (assertiontResult) {
    const {ancestorTitles = [], failureMessages, title, status} = assertiontResult;

    let formattedTitle = status === STATUS_FAILED ?
      chalk`{red ${title}}` :
      chalk`{rgb(80,80,80) ${title}}`;

    formattedTitle = [...ancestorTitles, formattedTitle].join(' › ');

    switch (status) {
    case STATUS_PASSED:
      if (!this.globalConfig.watch) {
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

      if (!this.globalConfig.watch) {
        this.writer.blank();
      }
      this.writer.suite(numFailingTests > 0, dir, base);
      this.writer.blank();
    }

    testResults.forEach(this.onAssertionResult);
  }

  onRunStart (results, options) {
    this.onRunStartResults = results;
    this.onRunStartOptions = options;
  }

  onRunComplete (contexts, results) {
    const {estimatedTime} = this.onRunStartOptions;
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

    this[sShouldFail] = numFailedTestSuites > 0 || numFailedTests > 0;

    this.writer.blank();
    this.writer.plan();
    this.writer.blank();
    this.writer.stats('Test Suites', numFailedTestSuites, numPendingTestSuites, numPassedTestSuites, numTotalTestSuites);
    this.writer.stats('Tests', numFailedTests, numPendingTests, numPassedTests, numTotalTests);
    if (snapshot) {
      this.writer.stats('Snapshots', snapshot.total - snapshot.matched - snapshot.added, 0, snapshot.matched + snapshot.added, snapshot.total);
    }
    this.writer.keyValue('Time', `${((Date.now() - startTime) / 1e3).toFixed(3)}s, estimated ${estimatedTime}s`);
    this.writer.commentLight('Ran all test suites.');
    this.writer.blank();
  }

  getLastError () {
    if (this[sShouldFail]) {
      return new Error('TAP Reporter: failing tests found');
    }

    return undefined;
  }
}

module.exports = TapReporter;
