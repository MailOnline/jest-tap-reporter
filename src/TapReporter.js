/* eslint-disable id-match, class-methods-use-this, no-console */
class TapReporter {
  constructor (globalConfig = {}, options = {}) {
    this._globalConfig = globalConfig;
    this._options = options;
    this._shouldFail = false;

    console.log('\n\nStarting ...');
  }

  onTestResult (contexts, {testResults}) {
    const text = [''];

    testResults.forEach((test, idx) => {
      if (test.status === 'passed') {
        text.push(`ok ${idx + 1} ${test.title}`);
      } else if (test.status === 'failed') {
        text.push(`not ok ${idx + 1} ${test.title}`);

        if (test.failureMessages.length > 0) {
          const diagnostics = test.failureMessages
            .reduce((lines, msg) => lines.concat(msg.split('\n')), [])
            .map((line) => `# ${line}`)
            .join('\n');

          text.push(diagnostics);
        }
      } else if (test.status === 'pending') {
        text.push(`ok ${idx + 1} ${test.title} # SKIP -`);
      }
    });

    console.log(text.join('\n'));
  }

  onRunComplete (contexts, results) {
    const text = [];

    this._shouldFail = results.numFailedTestSuites > 0 || results.numFailedTests > 0;

    text.push(`# tests ${results.numTotalTests}`);
    text.push(`# pass ${results.numPassedTests}`);
    text.push(`# fail ${results.numFailedTests}`);

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
