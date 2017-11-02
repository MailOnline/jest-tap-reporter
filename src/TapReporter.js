/* eslint-disable id-match, class-methods-use-this, no-console */
const chalk = require('chalk');
const ms = require('ms');

class TapReporter {
  constructor (globalConfig = {}, options = {}) {
    this._globalConfig = globalConfig;
    this._options = options;
    this._shouldFail = false;

    console.log('\n\nStarting ...\n');
  }

  onTestResult (contexts, {testResults}) {
    const text = [];

    testResults.forEach((test, idx) => {
      if (test.status === 'passed') {
        text.push(`${chalk.green('ok')} ${idx + 1} ${test.title}`);
      } else if (test.status === 'failed') {
        text.push(`${chalk.red('not ok')} ${idx + 1} ${test.title}`);

        if (test.failureMessages.length > 0) {
          const diagnostics = test.failureMessages
            .reduce((lines, msg) => lines.concat(msg.split('\n')), [])
            .map((line) => chalk.grey(`# ${line}`))
            .join('\n');

          text.push(diagnostics);
        }
      } else if (test.status === 'pending') {
        text.push(`${chalk.yellow('ok')} ${idx + 1} ${test.title} ${chalk.yellow('# SKIP')}`);
      }
    });

    console.log(text.join('\n'));
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
    const text = [];

    this._shouldFail = numFailedTestSuites > 0 || numFailedTests > 0;

    if (numFailedTestSuites > 0) {
      text.push(`# testSuites: ${skippedTestSuites}${chalk.red(`${numFailedTestSuites} failed`)}, ${numTotalTestSuites} total`);
    } else {
      text.push(`# testSuites: ${skippedTestSuites}${chalk.green(`${numPassedTestSuites} passed`)}, ${numTotalTestSuites} total`);
    }

    if (numFailedTests > 0) {
      text.push(`# tests:      ${skippedTests}${chalk.red(`${numFailedTests} failed`)}, ${numTotalTests} total`);
    } else {
      text.push(`# tests:      ${skippedTests}${chalk.green(`${numPassedTests} passed`)}, ${numTotalTests} total`);
    }

    text.push(`# time:       ${ms(Date.now() - startTime)}`);

    console.log(`\n${text.join('\n')}\n`);
  }

  getLastError () {
    if (this._shouldFail) {
      return new Error('TAP Reporter: failing tests found');
    }

    return undefined;
  }
}

module.exports = TapReporter;
