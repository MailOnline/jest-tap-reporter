/* eslint-disable no-console, max-nested-callbacks */
const chalk = require('chalk');
const TapReporter = require('../src/TapReporter');
const {
  failingTestSuite,
  passingTestSuite,
  severalTestsSuite,
  skippedTestSuite
} = require('./fixtures');

jest.mock('chalk', () => jest.fn());
jest.mock('../src/LineWriter');

chalk.mockImplementation((templates, ...rest) => {
  let str = '';

  for (let index = 0; index < rest.length; index++) {
    str += templates[index] + rest[index];
  }

  return str + templates[templates.length - 1];
});

const string = {
  any: expect.stringMatching(/.*/),
  empty: expect.stringMatching(/(^$)|(\s+$)/),
  // eslint-disable-next-line no-useless-escape
  startsWith: (query) => expect.stringMatching(new RegExp('^' + query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')))
};

const processTestLine = (testLine) => {
  const parts = testLine.split(' ');
  const isSuccess = testLine.indexOf('not') !== 0;
  const status = isSuccess ? parts[0] : `${parts[0]} ${parts[1]}`;
  const hasDirective = testLine.indexOf('# SKIP') >= 0;
  const descriptionStartIdx = isSuccess ? 2 : 3;

  let description;
  let directive;
  let diagnostics;

  if (hasDirective) {
    const directiveStartIdx = parts.indexOf('#');

    description = parts.slice(descriptionStartIdx, directiveStartIdx).join(' ');
    directive = parts.slice(directiveStartIdx).join(' ');
  } else {
    description = parts.slice(descriptionStartIdx).join(' ');
    directive = null;
  }

  const descriptionsParts = description.split('\n');

  if (descriptionsParts.length > 1) {
    description = descriptionsParts[0];
    diagnostics = descriptionsParts.slice(1);
  } else {
    diagnostics = null;
  }

  return {
    description,
    diagnostics,
    directive,
    status
  };
};

describe('TapReporter', () => {
  test('must publish the globalConfig and the options', () => {
    const globalConfig = {};
    const options = {};
    const tapReporter = new TapReporter(globalConfig, options);

    expect(tapReporter._globalConfig).toBe(globalConfig);
    expect(tapReporter._options).toBe(options);
  });

  test('must set _shouldFail to false by default', () => {
    const tapReporter = new TapReporter();

    expect(tapReporter._shouldFail).toBe(false);
  });

  test('must log the start of the tests', () => {
    const tapReporter = new TapReporter();

    expect(tapReporter.writer.start).toHaveBeenCalledTimes(1);
    expect(tapReporter.writer.start).not.toHaveBeenCalledTimes(2);
  });

  describe('onTestResults', () => {
    test('must output error tests', () => {
      const tapReporter = new TapReporter();

      tapReporter.onTestResult({}, failingTestSuite);

      expect(tapReporter.writer.failed).toHaveBeenCalledTimes(1);
      expect(tapReporter.writer.failed.mock.calls).toMatchSnapshot();
    });

    test('must output passing tests', () => {
      const tapReporter = new TapReporter();

      tapReporter.onTestResult({}, passingTestSuite);

      expect(tapReporter.writer.passed).toHaveBeenCalledTimes(1);
      expect(tapReporter.writer.passed.mock.calls).toMatchSnapshot();
    });

    describe('suite log', () => {
      test('must output a suite log with the Suites filePath if possible', () => {
        const tapReporter = new TapReporter();

        tapReporter.onTestResult({}, passingTestSuite);

        expect(tapReporter.writer.suite).toHaveBeenCalledTimes(1);
        expect(tapReporter.writer.suite.mock.calls).toMatchSnapshot();
      });
    });

    test('must output skipped tests', () => {
      const tapReporter = new TapReporter();

      tapReporter.onTestResult({}, skippedTestSuite);

      expect(tapReporter.writer.pending).toHaveBeenCalledTimes(1);
      expect(tapReporter.writer.pending.mock.calls).toMatchSnapshot();
    });

    test.only('TapReporter onTestResults must output all the tests on a suite tests', () => {
      const tapReporter = new TapReporter();

      tapReporter.onTestResult({}, severalTestsSuite);

      const testLines = console.log.mock.calls.map((call) => call[0]);

      testLines.forEach((testLine) => {
        const {
          description,
          directive,
          status
        } = processTestLine(testLine);

        expect(status).toBe('ok');
        expect(description).not.toBe(string.notEmpty);
        expect(directive).toBeNull();
      });
    });
  });

  test('onRunComplete must set _shouldFail to true if a suite failed', () => {
    const tapReporter = new TapReporter();
    const results = {
      numFailedTests: 0,
      numFailedTestSuites: 1,
      numPassedTests: 0,
      numPassedTestSuites: 0,
      numPendingTests: 0,
      numPendingTestSuites: 0,
      numTotalTests: 0,
      numTotalTestSuites: 0,
      startTime: Date.now() - 2000
    };

    tapReporter.onRunComplete({}, results);
    expect(tapReporter._shouldFail).toBe(true);
  });

  test('onRunComplete must set _shouldFail to true if a a test failed', () => {
    const tapReporter = new TapReporter();
    const results = {
      numFailedTests: 1,
      numFailedTestSuites: 0,
      numPassedTests: 0,
      numPassedTestSuites: 0,
      numPendingTests: 0,
      numPendingTestSuites: 0,
      numTotalTests: 0,
      numTotalTestSuites: 0,
      startTime: Date.now() - 2000
    };

    tapReporter.onRunComplete({}, results);
    expect(tapReporter._shouldFail).toBe(true);
  });

  test('onRunComplete all suites and tests pass', () => {
    const tapReporter = new TapReporter();
    const results = {
      numFailedTests: 0,
      numFailedTestSuites: 0,
      numPassedTests: 10,
      numPassedTestSuites: 2,
      numPendingTests: 0,
      numPendingTestSuites: 0,
      numTotalTests: 10,
      numTotalTestSuites: 2,
      startTime: Date.now() - 2000
    };

    tapReporter.onRunComplete({}, results);

    expect(console.log).toHaveBeenCalledWith('# testSuites: 2 passed, 2 total');
    expect(console.log).toHaveBeenCalledWith('# tests:      10 passed, 10 total');
    expect(console.log).toHaveBeenCalledWith('# time:       2s');
  });

  test('onRunComplete some suites and tests fail', () => {
    const tapReporter = new TapReporter();
    const results = {
      numFailedTests: 1,
      numFailedTestSuites: 1,
      numPassedTests: 10,
      numPassedTestSuites: 2,
      numPendingTests: 0,
      numPendingTestSuites: 0,
      numTotalTests: 10,
      numTotalTestSuites: 2,
      startTime: Date.now() - 2000
    };

    tapReporter.onRunComplete({}, results);

    expect(console.log).toHaveBeenCalledWith('# testSuites: 1 failed, 2 total');
    expect(console.log).toHaveBeenCalledWith('# tests:      1 failed, 10 total');
    expect(console.log).toHaveBeenCalledWith('# time:       2s');
  });

  test('onRunComplete 1 suite failed to execute', () => {
    const tapReporter = new TapReporter();
    const results = {
      numFailedTests: 0,
      numFailedTestSuites: 1,
      numPassedTests: 10,
      numPassedTestSuites: 1,
      numPendingTests: 0,
      numPendingTestSuites: 0,
      numTotalTests: 10,
      numTotalTestSuites: 2,
      startTime: Date.now() - 2000
    };

    tapReporter.onRunComplete({}, results);

    expect(console.log).toHaveBeenCalledWith('# testSuites: 1 failed, 2 total');
    expect(console.log).toHaveBeenCalledWith('# tests:      10 passed, 10 total');
    expect(console.log).toHaveBeenCalledWith('# time:       2s');
  });

  test('onRunComplete some suites and tests skipped', () => {
    const tapReporter = new TapReporter();
    const results = {
      numFailedTests: 0,
      numFailedTestSuites: 0,
      numPassedTests: 5,
      numPassedTestSuites: 1,
      numPendingTests: 5,
      numPendingTestSuites: 1,
      numTotalTests: 10,
      numTotalTestSuites: 2,
      startTime: Date.now() - 2000
    };

    tapReporter.onRunComplete({}, results);

    expect(console.log).toHaveBeenCalledWith('# testSuites: 1 skipped, 1 passed, 2 total');
    expect(console.log).toHaveBeenCalledWith('# tests:      5 skipped, 5 passed, 10 total');
    expect(console.log).toHaveBeenCalledWith('# time:       2s');
  });

  test('getLastError must return an error the run should fail and undefined otherwise', () => {
    let tapReporter = new TapReporter();
    const results = {
      numFailedTests: 1,
      numFailedTestSuites: 0,
      numPassedTests: 0,
      numPassedTestSuites: 0,
      numPendingTests: 0,
      numPendingTestSuites: 0,
      numTotalTests: 0,
      numTotalTestSuites: 0,
      startTime: Date.now() - 2000
    };

    console.log.mockClear();
    tapReporter.onRunComplete({}, results);
    expect(tapReporter.getLastError()).toBeInstanceOf(Error);

    tapReporter = new TapReporter();
    expect(tapReporter.getLastError()).toBe(undefined);
  });
});
