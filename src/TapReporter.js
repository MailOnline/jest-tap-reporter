/* eslint-disable id-match, class-methods-use-this, no-console */
const chalk = require('chalk');
const ms = require('ms');
const Logger = require('./helpers/Logger');

class TapReporter {
  constructor (globalConfig = {}, options = {}) {
    const {logLevel = 'INFO'} = options;

    this._globalConfig = globalConfig;
    this._options = options;
    this._shouldFail = false;
    this.logger = new Logger({
      logLevel
    });

    this.logger.log('\n\n# Starting ...\n');
  }

  onTestResult (contexts, {testResults}) {
    testResults.forEach((test) => {
      if (test.status === 'passed') {
        this.logger.log(`${chalk.green('ok')} ${test.title}`);
      } else if (test.status === 'failed') {
        this.logger.log(`${chalk.red('not ok')} ${test.title}`);

        if (test.failureMessages.length > 0) {
          const diagnostics = test.failureMessages
            .reduce((lines, msg) => lines.concat(msg.split('\n')), [])
            .map((line) => chalk.grey(`# ${line}`))
            .join('\n');

          this.logger.error(diagnostics);
        }
      } else if (test.status === 'pending') {
        this.logger.log(`${chalk.yellow('ok')} ${test.title} ${chalk.yellow('# SKIP')}`);
      }
    });
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
  }

  getLastError () {
    if (this._shouldFail) {
      return new Error('TAP Reporter: failing tests found');
    }

    return undefined;
  }
}

module.exports = TapReporter;
