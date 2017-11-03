/* eslint-disable no-console */
const TapReporter = require('../src/TapReporter');
const {
  failingTestSuite,
  passingTestSuite,
  severalTestsSuite,
  skippedTestSuite
} = require('./fixtures');

jest.mock('chalk', () => ({
  bgBlue: (str) => str,
  bgGreen: (str) => str,
  bgRed: (str) => str,
  green: (str) => str,
  grey: (str) => str,
  red: (str) => str,
  yellow: (str) => str
}));

let origLog;

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

beforeEach(() => {
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

test('TapReporter must log the start of the tests', () => {
  // eslint-disable-next-line no-unused-vars
  const tapReporter = new TapReporter();

  expect(console.log).toHaveBeenCalledTimes(2);
  expect(console.log).toHaveBeenCalledWith('\n');
  expect(console.log).toHaveBeenCalledWith('\n\n# Starting ...\n');
});

test('TapReporter onTestResults must output error tests', () => {
  const tapReporter = new TapReporter();

  console.log.mockClear();

  tapReporter.onTestResult({}, failingTestSuite);

  const {
    description,
    directive,
    status
  } = processTestLine(console.log.mock.calls[0][0]);

  const {
    diagnostics
  } = processTestLine(console.log.mock.calls[1][0]);

  expect(status).toBe('not ok');
  expect(description).not.toBe(string.notEmpty);
  expect(directive).toBeNull();
  expect(diagnostics.length > 0).toBe(true);

  diagnostics.forEach((diagnosticsLine) => {
    expect(diagnosticsLine).toEqual(string.startsWith('# '));
  });
});

test('TapReporter onTestResults must output passing tests', () => {
  const tapReporter = new TapReporter();

  console.log.mockClear();

  tapReporter.onTestResult({}, passingTestSuite);

  const {
    description,
    diagnostics,
    directive,
    status
  } = processTestLine(console.log.mock.calls[1][0]);

  expect(status).toBe('ok');
  expect(description).not.toBe(string.notEmpty);
  expect(directive).toBeNull();
  expect(diagnostics).toBeNull();
});

test('TapReporter must output a Suite log with the Suites filePath if possible', () => {
  let tapReporter = new TapReporter();

  console.log.mockClear();

  tapReporter.onTestResult({}, passingTestSuite);

  expect(console.log.mock.calls[0][0]).toBe('\n# SUITE  /Users/carlospastor/dev/mailonline/TapReporter.spec.js');
  tapReporter = new TapReporter();

  console.log.mockClear();

  tapReporter.onTestResult({}, failingTestSuite);

  expect(console.log.mock.calls[0][0]).not.toEqual(string.startsWith('\n# SUITE'));
});

test('TapReporter onTestResults must output skipped tests', () => {
  const tapReporter = new TapReporter();

  console.log.mockClear();

  tapReporter.onTestResult({}, skippedTestSuite);

  expect(console.log).toHaveBeenCalledTimes(1);

  const {
    description,
    diagnostics,
    directive,
    status
  } = processTestLine(console.log.mock.calls[0][0]);

  expect(status).toBe('ok');
  expect(description).not.toBe(string.notEmpty);
  expect(directive).toBe('# SKIP');
  expect(diagnostics).toBeNull();
});

test('TapReporter onTestResults must output all the tests on a suite tests', () => {
  const tapReporter = new TapReporter();

  console.log.mockClear();

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

test('TapReporter onRunComplete must set _shouldFail to true if a suite failed', () => {
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

test('TapReporter onRunComplete must set _shouldFail to true if a a test failed', () => {
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

test('TapReporter onRunComplete all suites and tests pass', () => {
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

test('TapReporter onRunComplete some suites and tests fail', () => {
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

test('TapReporter onRunComplete 1 suite failed to execute', () => {
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

test('TapReporter onRunComplete some suites and tests skipped', () => {
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

test('TapReporter getLastError must return an error the run should fail and undefined otherwise', () => {
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
