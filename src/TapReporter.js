/* eslint-disable id-match, class-methods-use-this, no-console */
const path = require('path');
const chalk = require('chalk');
const ms = require('ms');
const Logger = require('./helpers/Logger');

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

    this.logger.log('\n');
    this.logger.info('\n\n# Starting ...\n');

    this.onTest = (test) => {
      this.counter += 1;
      const {counter} = this;
      const {ancestorTitles, title} = test;
      let tapLine;
      let formattedTitle = title;

      if (ancestorTitles.length) {
        formattedTitle = [...ancestorTitles, formattedTitle].join(' › ');
      }

      if (test.status === 'passed') {
        if (!this._watch) {
          tapLine = chalk`{green ok} ${counter} ${formattedTitle}`;
        }
      } else if (test.status === 'failed') {
        tapLine = chalk`{red not ok} ${counter} ${formattedTitle}`;
        if (test.failureMessages.length > 0) {
          const diagnostics = test.failureMessages
            .reduce((lines, msg) => lines.concat(msg.split('\n')), [])
            .map((line) => chalk.grey(`# ${line}`))
            .join('\n');

          this.logger.error(diagnostics);
        }
      } else if (test.status === 'pending') {
        tapLine = chalk`{yellow ok} ${counter} ${formattedTitle} {yellow # SKIP}`;
      }

      this.logger.log(tapLine);
    };
  }

  onTestResult (contexts, suite) {
    const {testResults, testFilePath, numFailingTests} = suite;

    if (testFilePath) {
      const {dir, base} = path.parse(testFilePath);
      const prefix = this._watch ? '' : '\n';
      const label = numFailingTests > 0 ?
        chalk`{bgRed.bold.rgb(255,255,255)  FAIL }` :
        chalk`{bgGreen.bold.rgb(255,255,255)  PASS }`;
      const tapLine = chalk`${prefix}{rgb(255,255,255) #} ${label} {grey ${dir}${path.sep}}{bold ${base}}`;

      this.logger.info(tapLine + '\n');
    }

    testResults.forEach(this.onTest);
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
