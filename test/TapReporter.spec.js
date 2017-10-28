/* eslint-disable no-console */
const TapReporter = require('../src/TapReporter');
const jestResultsToTap = require('../src/jestResultsToTap');

jest.mock('../src/jestResultsToTap.js');

let origLog;

beforeEach(() => {
  jestResultsToTap.mockImplementation(() => '### TAP OUTPUT ###');
  origLog = console.log;
  console.log = jest.fn();
});

afterEach(() => {
  console.log = origLog;
});

test('TapReporter must publish the globalConfig and the options', () => {
  const globalConfig = {};
  const options = {};
  const tapReporter = new TapReporter(globalConfig, options);

  expect(tapReporter._globalConfig).toBe(globalConfig);
  expect(tapReporter._options).toBe(options);
});

test('TapReporter must set _shouldFail to false by default', () => {
  const tapReporter = new TapReporter();

  expect(tapReporter._shouldFail).toBe(false);
});

test('TapReporter onRunComplete must set _shouldFail to true if a suite failed', () => {
  const tapReporter = new TapReporter();
  const results = {
    numFailedTests: 0,
    numFailedTestSuites: 1
  };

  tapReporter.onRunComplete({}, results);
  expect(tapReporter._shouldFail).toBe(true);
});

test('TapReporter onRunComplete must set _shouldFail to true if a a test failed', () => {
  const tapReporter = new TapReporter();
  const results = {
    numFailedTests: 1,
    numFailedTestSuites: 0
  };

  tapReporter.onRunComplete({}, results);
  expect(tapReporter._shouldFail).toBe(true);
});

test('TapReporter onRunComplte must output the Tap results', () => {
  const tapReporter = new TapReporter();
  const results = {
    numFailedTests: 1,
    numFailedTestSuites: 0
  };

  tapReporter.onRunComplete({}, results);
  expect(console.log).toHaveBeenCalledTimes(1);
  expect(console.log).toHaveBeenCalledWith('\n### TAP OUTPUT ###');
});

test('TapReporter getLastError must return an error the run should fail and undefined otherwise', () => {
  let tapReporter = new TapReporter();
  const results = {
    numFailedTests: 1,
    numFailedTestSuites: 0
  };

  tapReporter.onRunComplete({}, results);
  expect(tapReporter.getLastError()).toBeInstanceOf(Error);

  tapReporter = new TapReporter();
  expect(tapReporter.getLastError()).toBe(undefined);
});
