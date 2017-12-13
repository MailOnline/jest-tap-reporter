/* eslint-disable id-match, class-methods-use-this, no-console */
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const LoggerTemporal = require('./loggers/LoggerTemporal');
const LineWriter = require('./LineWriter');

const STATUS_PASSED = 'passed';
const STATUS_FAILED = 'failed';
const STATUS_PENDING = 'pending';

const sShouldFail = Symbol('shouldFail');

// eslint-disable-next-line no-process-env
const isCI = () => Boolean(process.env.CI);

class TapReporter {
  constructor (globalConfig = {}, options = {}) {
    this.globalConfig = globalConfig;
    this.setOptions(options);

    const logger = new LoggerTemporal({
      logLevel: this.options.logLevel,
      stream: this.createOutputStream()
    });

    this[sShouldFail] = false;
    this.writer = new LineWriter(logger, globalConfig.rootDir);

    this.lastAggregatedResults = {};
    this.onRunStartResults = {};
    this.onRunStartOptions = {};
  }

  setOptions (options) {
    if (!options.showProgress || isCI() || options.filePath) {
      options.showProgress = false;
    } else {
      options.showProgress = true;
    }

    if (!options.logLevel) {
      options.logLevel = 'INFO';
    }

    if (options.filePath) {
      chalk.level = 0;
    }

    options.showHeader = options.showHeader === undefined ? true : Boolean(options.showHeader);

    this.options = options;
  }

  writingToFile () {
    return Boolean(this.options.filePath);
  }

  createOutputStream () {
    const {filePath} = this.options;

    if (filePath) {
      const {rootDir} = this.globalConfig;
      const filename = path.isAbsolute(filePath) ? filePath : path.join(rootDir, filePath);

      return fs.createWriteStream(filename);
    } else {
      return process.stdout;
    }
  }

  pathRelativeToRoot (filePath) {
    return path.relative(this.globalConfig.rootDir, filePath);
  }

  errors (errors) {
    this.writer.errors(errors, this.options.showInternalStackTraces);
  }

  onAssertionResult (assertiontResult, isLast) {
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
      this.errors(failureMessages);
      if (!isLast) {
        this.writer.blank();
      }
      break;
    case STATUS_PENDING:
      this.writer.skipped(formattedTitle);
      break;
    default:

      // eslint-disable-next-line no-warning-comments
      // TODO: add tests for this and reconsider in general what to do in the default case.
      this.writer.commentLight(chalk`{italic Unknown status: ${status}}`);
    }
  }

  onRunStart (results, options) {
    this.onRunStartOptions = options;

    if (this.options.showHeader) {
      this.writer.start(results.numTotalTestSuites);
    }
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
      this.errors([testExecError.stack], this.options.hideInternalsFromStackTraces);
    } else {
      const last = testResults.length - 1;

      testResults.forEach((assertionResult, index) => {
        this.onAssertionResult(assertionResult, index === last);
      });
    }

    if (this.options.showProgress) {
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
