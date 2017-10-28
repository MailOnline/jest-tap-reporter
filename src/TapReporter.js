/* eslint-disable id-match, class-methods-use-this, no-unused-vars, no-console */
const jestResultsToTap = require('./jestResultsToTap');

class TapReporter {
  constructor (globalConfig = {}, options = {}) {
    this._globalConfig = globalConfig;
    this._options = options;
    this._shouldFail = false;
  }

  onRunComplete (contexts, results) {
    this._shouldFail = results.numFailedTestSuites > 0 || results.numFailedTests > 0;
    const tapOutput = jestResultsToTap(results);

    console.log(`\n${tapOutput}`);
  }

  getLastError () {
    if (this._shouldFail) {
      return new Error('TAP Reporter: failing tests found');
    }

    return undefined;
  }
}

module.exports = TapReporter;
