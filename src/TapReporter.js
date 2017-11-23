/* eslint-disable id-match, class-methods-use-this, no-console */
const path = require('path');
const chalk = require('chalk');
const LoggerTemporal = require('./LoggerTemporal');
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
    this.writer = new LineWriter(new LoggerTemporal({logLevel}), globalConfig.rootDir);
    this.onAssertionResult = this.onAssertionResult.bind(this);

    this.lastAggregatedResults = {};
    this.onRunStartResults = {};
    this.onRunStartOptions = {};
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
      this.writer.skipped(formattedTitle);
      this.writer.errors(failureMessages);
      break;
    default:

      // eslint-disable-next-line no-warning-comments
      // TODO: add tests for this and reconsider in general what to do in the default case.
      this.writer.commentLight(chalk`{italic Unknown status: ${status}}`);
    }
  }

  onRunStart (results, options) {
    this.onRunStartOptions = options;

    this.writer.start(results.numTotalTestSuites);
    this.writer.blank();
  }

  onTestResult (test, testResult, aggregatedResults) {
    this.lastAggregatedResults = aggregatedResults;

    this.writer.logger.buffer();

    const {testExecError, testResults, testFilePath, numFailingTests} = testResult;
    const {dir, base} = path.parse(testFilePath);
    const suiteFailed = Boolean(testExecError);

    if (!this.globalConfig.watch) {
      this.writer.blank();
    }
    this.writer.suite(numFailingTests > 0 || suiteFailed, dir, base);
    this.writer.blank();

    // If error in test suite itself.
    if (suiteFailed) {
      this.writer.errors([testExecError.stack]);
    } else {
      testResults.forEach(this.onAssertionResult);
    }

    this.writer.logger.temporary();

    this.writer.blank();
    this.writer.aggregatedResults(aggregatedResults);

    const {estimatedTime} = this.onRunStartOptions;

    if (estimatedTime) {
      const startTime = aggregatedResults.startTime;
      const percentage = (Date.now() - startTime) / 1e3 / estimatedTime / 3;

      if (percentage <= 1) {
        this.writer.blank();
        this.writer.timeProgressBar(percentage);
      }
    }

    this.writer.logger.flush();
  }

  onRunComplete (contexts, aggregatedResults) {
    const {estimatedTime} = this.onRunStartOptions;

    const suitesFailed = aggregatedResults.numFailedTestSuites;
    const testsFailed = aggregatedResults.numFailedTests;

    this[sShouldFail] = testsFailed > 0 || suitesFailed > 0;

    this.writer.blank();
    this.writer.plan();
    this.writer.blank();
    this.writer.aggregatedResults(aggregatedResults, estimatedTime);
    this.writer.blank();
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
