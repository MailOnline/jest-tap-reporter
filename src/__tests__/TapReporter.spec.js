/* eslint-disable no-console, max-nested-callbacks */
const chalk = require('chalk');
const TapReporter = require('../TapReporter');
const LoggerTemporal = require('../loggers/LoggerTemporal');
const {
  failingTestSuite,
  passingTestSuite,
  severalTestsSuite,
  skippedTestSuite
} = require('../../test/fixtures');

jest.mock('chalk');
jest.mock('../LineWriter');
jest.mock('../loggers/LoggerTemporal');

const newTapReporter = () => {
  const tapReporter = new TapReporter();

  tapReporter.writer.logger = new LoggerTemporal();

  return tapReporter;
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

    tapReporter.onRunStart({}, {});

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
      snapshot: {},
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
      const tapReporter = newTapReporter();

      tapReporter.onTestResult({}, failingTestSuite);

      expect(tapReporter.writer.failed).toHaveBeenCalledTimes(1);
      expect(tapReporter.writer.failed.mock.calls).toMatchSnapshot();
    });

    test('must output passing tests', () => {
      chalk.__stripColors();
      const tapReporter = newTapReporter();

      tapReporter.onTestResult({}, passingTestSuite);

      expect(tapReporter.writer.passed).toHaveBeenCalledTimes(1);
      expect(tapReporter.writer.passed.mock.calls).toMatchSnapshot();
    });

    test('must output skipped tests', () => {
      chalk.__stripColors();
      const tapReporter = newTapReporter();

      tapReporter.onTestResult({}, skippedTestSuite);

      expect(tapReporter.writer.skipped).toHaveBeenCalledTimes(1);
      expect(tapReporter.writer.skipped.mock.calls).toMatchSnapshot();
    });

    test('must output all the tests on a suite tests', () => {
      chalk.__stripColors();
      const tapReporter = newTapReporter();

      tapReporter.onTestResult({}, severalTestsSuite);

      expect(tapReporter.writer.passed.mock.calls).toMatchSnapshot();
      expect(tapReporter.writer.failed.mock.calls).toMatchSnapshot();
      expect(tapReporter.writer.skipped.mock.calls).toMatchSnapshot();
    });

    describe('suite log', () => {
      test('must output a suite log with the Suites filePath if possible', () => {
        const tapReporter = newTapReporter();

        tapReporter.onTestResult({}, passingTestSuite);

        expect(tapReporter.writer.suite).toHaveBeenCalledTimes(1);
        expect(tapReporter.writer.suite.mock.calls).toMatchSnapshot();
      });
    });
  });

  describe('onRunComplete', () => {
    test('calls .aggregatedResults() printer', () => {
      const tapReporter = newTapReporter();
      const aggregatedResults = {};

      tapReporter.onRunComplete({}, aggregatedResults);

      expect(tapReporter.writer.aggregatedResults.mock.calls[0][0]).toBe(aggregatedResults);
    });
  });
});
