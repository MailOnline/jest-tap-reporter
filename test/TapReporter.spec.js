/* eslint-disable no-console, max-nested-callbacks */
const chalk = require('chalk');
const TapReporter = require('../src/TapReporter');
const {
  failingTestSuite,
  passingTestSuite,
  severalTestsSuite,
  skippedTestSuite
} = require('./fixtures');

jest.mock('chalk');
jest.mock('../src/LineWriter');

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

    expect(tapReporter.globalConfig).toBe(globalConfig);
    expect(tapReporter.options).toBe(options);
  });

  test('must log the start of the tests', () => {
    const tapReporter = new TapReporter();

    expect(tapReporter.writer.start).toHaveBeenCalledTimes(1);
    expect(tapReporter.writer.start).not.toHaveBeenCalledTimes(2);
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

    tapReporter.onRunComplete({}, results);
    expect(tapReporter.getLastError()).toBeInstanceOf(Error);

    tapReporter = new TapReporter();
    expect(tapReporter.getLastError()).toBe(undefined);
  });

  describe('onTestResults', () => {
    test('must output error tests', () => {
      chalk.__stripColors();
      const tapReporter = new TapReporter();

      tapReporter.onTestResult({}, failingTestSuite);

      expect(tapReporter.writer.failed).toHaveBeenCalledTimes(1);
      expect(tapReporter.writer.failed.mock.calls).toMatchSnapshot();
    });

    test('must output passing tests', () => {
      chalk.__stripColors();
      const tapReporter = new TapReporter();

      tapReporter.onTestResult({}, passingTestSuite);

      expect(tapReporter.writer.passed).toHaveBeenCalledTimes(1);
      expect(tapReporter.writer.passed.mock.calls).toMatchSnapshot();
    });

    test('must output skipped tests', () => {
      chalk.__stripColors();
      const tapReporter = new TapReporter();

      tapReporter.onTestResult({}, skippedTestSuite);

      expect(tapReporter.writer.pending).toHaveBeenCalledTimes(1);
      expect(tapReporter.writer.pending.mock.calls).toMatchSnapshot();
    });

    test('must output all the tests on a suite tests', () => {
      chalk.__stripColors();
      const tapReporter = new TapReporter();

      tapReporter.onTestResult({}, severalTestsSuite);

      expect(tapReporter.writer.passed.mock.calls).toMatchSnapshot();
      expect(tapReporter.writer.failed.mock.calls).toMatchSnapshot();
      expect(tapReporter.writer.pending.mock.calls).toMatchSnapshot();
    });

    describe('suite log', () => {
      test('must output a suite log with the Suites filePath if possible', () => {
        const tapReporter = new TapReporter();

        tapReporter.onTestResult({}, passingTestSuite);

        expect(tapReporter.writer.suite).toHaveBeenCalledTimes(1);
        expect(tapReporter.writer.suite.mock.calls).toMatchSnapshot();
      });
    });
  });

  describe('onRunComplete', () => {
    test('all suites and tests pass', () => {
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

      expect(tapReporter.writer.stats.mock.calls).toEqual([
        ['Test Suites', 0, 0, 2, 2],
        ['Tests', 0, 0, 10, 10]
      ]);
    });

    test('some suites and tests fail', () => {
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

      expect(tapReporter.writer.stats.mock.calls).toEqual([
        ['Test Suites', 1, 0, 2, 2],
        ['Tests', 1, 0, 10, 10]
      ]);
    });

    test('1 suite failed to execute', () => {
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

      expect(tapReporter.writer.stats.mock.calls).toEqual([
        ['Test Suites', 1, 0, 1, 2],
        ['Tests', 0, 0, 10, 10]
      ]);
    });

    test('some suites and tests skipped', () => {
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

      expect(tapReporter.writer.stats.mock.calls).toEqual([
        ['Test Suites', 0, 1, 1, 2],
        ['Tests', 0, 5, 5, 10]
      ]);
    });
  });
});
