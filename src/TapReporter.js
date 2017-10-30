/* eslint-disable id-match, class-methods-use-this, no-console */
const chalk = require('chalk');

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
        text.push(`${chalk.yellow('ok')} ${idx + 1} ${test.title} ${chalk.yellow('# SKIP -')}`);
      }
    });

    console.log(text.join('\n'));
  }

  onRunComplete (contexts, results) {
    const text = [];
    const format = (msg, color, useColor = true) => {
      if (useColor) {
        return chalk[color](msg);
      }

      return msg;
    };

    this._shouldFail = results.numFailedTestSuites > 0 || results.numFailedTests > 0;

    text.push(format(chalk.grey(`# Total tests: ${results.numTotalTests}\n`), this._shouldFail ? 'bgRed' : 'bgGreen'));
    text.push(format(`# Passed suites: ${results.numPassedTestSuites}`, 'green', !this._shouldFail));
    text.push(format(`# Failed suites: ${results.numFailedTestSuites}`, 'red', this._shouldFail));
    text.push(format(`# Passed tests: ${results.numPassedTests}`, 'green', !this._shouldFail));
    text.push(format(`# Failed tests: ${results.numFailedTests}`, 'red', this._shouldFail));
    text.push(format(`# Skipped tests: ${results.numPendingTests}`, 'yellow', results.numPendingTests > 0));

    console.log(`\n${text.join('\n')}`);
  }

  getLastError () {
    if (this._shouldFail) {
      return new Error('TAP Reporter: failing tests found');
    }

    return undefined;
  }
}

module.exports = TapReporter;
