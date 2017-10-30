/* eslint-disable no-console */
const TapReporter = require('../src/TapReporter');
const {
  failingTestSuite,
  passingTestSuite,
  severalTestsSuite,
  skippedTestSuite
} = require('./fixtures');

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
  const testNumber = isSuccess ? parts[1] : parts[2];
  const hasDirective = testLine.indexOf('# SKIP -') >= 0;
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
    status,
    testNumber
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

  expect(console.log).toHaveBeenCalledTimes(1);
  expect(console.log).toHaveBeenCalledWith('\n\nStarting ...\n');
});

test('TapReporter onTestResults must output error tests', () => {
  const tapReporter = new TapReporter();

  console.log.mockClear();

  tapReporter.onTestResult({}, failingTestSuite);

  expect(console.log).toHaveBeenCalledTimes(1);

  const {
    description,
    diagnostics,
    directive,
    status,
    testNumber
  } = processTestLine(console.log.mock.calls[0][0]);

  expect(status).toBe('not ok');
  expect(testNumber).toBe('1');
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

  expect(console.log).toHaveBeenCalledTimes(1);

  const {
    description,
    diagnostics,
    directive,
    status,
    testNumber
  } = processTestLine(console.log.mock.calls[0][0]);

  expect(status).toBe('ok');
  expect(testNumber).toBe('1');
  expect(description).not.toBe(string.notEmpty);
  expect(directive).toBeNull();
  expect(diagnostics).toBeNull();
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
    status,
    testNumber
  } = processTestLine(console.log.mock.calls[0][0]);

  expect(status).toBe('ok');
  expect(testNumber).toBe('1');
  expect(description).not.toBe(string.notEmpty);
  expect(directive).toBe('# SKIP -');
  expect(diagnostics).toBeNull();
});

test('TapReporter onTestResults must output all the tests on a suite tests', () => {
  const tapReporter = new TapReporter();

  console.log.mockClear();

  tapReporter.onTestResult({}, severalTestsSuite);

  expect(console.log).toHaveBeenCalledTimes(1);

  const testLines = console.log.mock.calls[0][0].split('\n');

  testLines.forEach((testLine, idx) => {
    const {
      description,
      directive,
      status,
      testNumber
    } = processTestLine(testLine);

    expect(status).toBe('ok');
    expect(testNumber).toBe(String(idx + 1));
    expect(description).not.toBe(string.notEmpty);
    expect(directive).toBeNull();
  });
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

test('TapReporter onRunComplete must output the Tap results', () => {
  const tapReporter = new TapReporter();
  const results = {
    numFailedTests: 1,
    numFailedTestSuites: 0,
    numPassedTests: 0,
    numPassedTestSuites: 0,
    numPendingTests: 0,
    numPendingTestSuites: 0,
    numTotalTests: 1,
    numTotalTestSuites: 1
  };

  tapReporter.onRunComplete({}, results);

  expect(console.log).toHaveBeenCalledWith(`
# Total tests: 1
# Passed suites: 0
# Failed suites: 0
# Passed tests: 0
# Failed tests: 1
# Skipped tests: 0`);
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
    numTotalTests: 1,
    numTotalTestSuites: 1
  };

  console.log.mockClear();
  tapReporter.onRunComplete({}, results);
  expect(tapReporter.getLastError()).toBeInstanceOf(Error);

  tapReporter = new TapReporter();
  expect(tapReporter.getLastError()).toBe(undefined);
});
