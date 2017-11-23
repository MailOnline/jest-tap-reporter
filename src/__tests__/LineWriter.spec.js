/* eslint-disable max-nested-callbacks */
const chalk = require('chalk');
const Logger = require('../loggers/Logger');
const LineWriter = require('../LineWriter');

jest.mock('chalk');
jest.mock('../loggers/Logger');

const create = (root = '/jest-tap-reporter', logger = new Logger()) => {
  const writer = new LineWriter(logger, root);

  return writer;
};

const MDASH = '\u2014';
const CIRCLE = '●';

describe('LineWriter', () => {
  beforeEach(() => {
    chalk.__stripColors();
  });

  test('is a function', () => {
    expect(typeof LineWriter).toBe('function');
  });

  test('can construct without error', () => {
    create();
  });

  describe('.getNextNumber()', () => {
    test('returns a positive number', () => {
      const writer = create();
      const num = writer.getNextNumber();

      expect(typeof num).toBe('number');
      expect(num).toBeGreaterThan(0);
    });

    test('starts with 1', () => {
      const writer = create();
      const num = writer.getNextNumber();

      expect(num).toBe(1);
    });

    test('each next number increases by 1', () => {
      const writer = create();
      let last = writer.getNextNumber();

      for (let index = 0; index < 100; index++) {
        const current = writer.getNextNumber();

        expect(last + 1).toBe(current);
        last = current;
      }
    });
  });

  describe('.blank()', () => {
    test('logs a blank line using .info()', () => {
      const writer = create();

      writer.blank();

      expect(writer.logger.info).toHaveBeenCalledTimes(1);
      expect(writer.logger.info.mock.calls[0]).toEqual(['']);
    });
  });

  describe('.comment()', () => {
    test('logs using .info()', () => {
      const writer = create();

      writer.comment('something');

      expect(writer.logger.info).toHaveBeenCalledTimes(1);
    });

    test('writes a TAP comment', () => {
      chalk.__stripColors();

      const writer = create();

      writer.comment('foo');

      expect(writer.logger.info).toHaveBeenCalledTimes(1);
      expect(writer.logger.info.mock.calls[0]).toEqual(['# foo']);
    });

    test('hides comment hash symbol from console', () => {
      chalk.__showTemplates();

      const writer = create();

      writer.comment('foo');

      expect(writer.logger.info).toHaveBeenCalledTimes(1);
      expect(writer.logger.info.mock.calls[0]).toEqual(['{hidden #} foo']);
    });
  });

  describe('.start()', () => {
    test('prints start message', () => {
      chalk.__stripColors();

      const writer = create();

      writer.start();

      expect(writer.logger.info.mock.calls).toMatchSnapshot();
    });

    test('prints start message with suite number if provided', () => {
      chalk.__stripColors();

      const writer = create();

      writer.start(3);

      expect(writer.logger.info.mock.calls).toMatchSnapshot();
    });
  });

  describe('.commentLight()', () => {
    test('prints dimmed comment', () => {
      const writer = create();

      writer.comment = jest.fn();
      writer.commentLight('foo');

      expect(writer.comment.mock.calls).toMatchSnapshot();
    });
  });

  describe('.keyValue()', () => {
    test('prints key-value pair', () => {
      const writer = create();

      writer.comment = jest.fn();
      writer.keyValue('foo', 'bar');

      expect(writer.comment.mock.calls).toMatchSnapshot();
    });
  });

  describe('.keyValueList()', () => {
    test('formats 3-tuple list into a value and calls .keyValue()', () => {
      chalk.__showTemplates();

      const writer = create();

      writer.keyValue = jest.fn();
      writer.keyValueList('foo', [
        ['name1', 'styles1', 1],
        ['name2', 'styles2', 2],
        ['name3', 'styles3', 3],
        ['name4', 'styles4', 4]
      ]);

      expect(writer.keyValue).toHaveBeenCalledTimes(1);
      expect(writer.keyValue.mock.calls[0]).toMatchSnapshot();
    });
  });

  describe('.stats()', () => {
    describe('when zero tests', () => {
      test('shows only total zero', () => {
        const writer = create();

        writer.keyValue = jest.fn();
        writer.stats('foo', 0, 0, 0, 0);

        expect(writer.keyValue).toHaveBeenCalledTimes(1);
        expect(writer.keyValue.mock.calls[0]).toMatchSnapshot();
      });
    });

    describe('when all tests pass', () => {
      test('shows only passed and total tests', () => {
        const writer = create();

        writer.keyValue = jest.fn();
        writer.stats('foo', 0, 0, 1, 1);

        expect(writer.keyValue).toHaveBeenCalledTimes(1);
        expect(writer.keyValue.mock.calls[0]).toMatchSnapshot();
      });
    });

    describe('when some tests fail', () => {
      test('shows only passed, failed and total tests', () => {
        const writer = create();

        writer.keyValue = jest.fn();
        writer.stats('foo', 1, 0, 1, 2);

        expect(writer.keyValue).toHaveBeenCalledTimes(1);
        expect(writer.keyValue.mock.calls[0]).toMatchSnapshot();
      });
    });

    describe('when some tests are skipped', () => {
      test('shows all items', () => {
        const writer = create();

        writer.keyValue = jest.fn();
        writer.stats('foo', 1, 1, 1, 3);

        expect(writer.keyValue).toHaveBeenCalledTimes(1);
        expect(writer.keyValue.mock.calls[0]).toMatchSnapshot();
      });

      describe('and no tests fail', () => {
        test('shows only passed, skipped and total tests', () => {
          const writer = create();

          writer.keyValue = jest.fn();
          writer.stats('foo', 0, 1, 1, 2);

          expect(writer.keyValue).toHaveBeenCalledTimes(1);
          expect(writer.keyValue.mock.calls[0]).toMatchSnapshot();
        });
      });
    });
  });

  describe('.snapshots()', () => {
    describe('when no snapshots exit', () => {
      test('should not print anything', () => {
        const writer = create();

        writer.keyValue = jest.fn();
        writer.snapshots(0, 0, 0, 0, 0);

        expect(writer.keyValue).toHaveBeenCalledTimes(0);
      });
    });

    describe('when all values are greater than zero', () => {
      test('prints them all', () => {
        const writer = create();

        writer.keyValue = jest.fn();
        writer.snapshots(1, 1, 1, 1, 4);

        expect(writer.keyValue).toHaveBeenCalledTimes(1);
        expect(writer.keyValue.mock.calls[0]).toMatchSnapshot();
      });
    });
  });

  describe('.result()', () => {
    test('logs passed test', () => {
      const writer = create();

      writer.logger.log = jest.fn();
      writer.result('ok', 'Test passed');

      expect(writer.logger.log).toHaveBeenCalledTimes(1);
      expect(writer.logger.log.mock.calls[0][0]).toBe('ok 1 Test passed');
    });

    test('logs failed test', () => {
      const writer = create();

      writer.logger.log = jest.fn();
      writer.result('not ok', 'Test failed');

      expect(writer.logger.log).toHaveBeenCalledTimes(1);
      expect(writer.logger.log.mock.calls[0][0]).toBe('not ok 1 Test failed');
    });

    test('increments test counter', () => {
      const writer = create();

      writer.logger.log = jest.fn();

      writer.result('ok', 'Test passed');
      writer.result('not ok', 'Test failed');

      expect(writer.logger.log).toHaveBeenCalledTimes(2);

      expect(writer.logger.log.mock.calls[0][0]).toBe('ok 1 Test passed');
      expect(writer.logger.log.mock.calls[1][0]).toBe('not ok 2 Test failed');
    });
  });

  describe('.passed()', () => {
    test('calls .result() with the right parameters', () => {
      chalk.__stripColors();

      const writer = create();

      writer.result = jest.fn();
      writer.passed('Test passed');

      expect(writer.result).toHaveBeenCalledTimes(1);
      expect(writer.result.mock.calls[0]).toEqual(['ok', `${MDASH} Test passed`]);
    });

    test('colors "ok" green', () => {
      chalk.__showTemplates();

      const writer = create();

      writer.result = jest.fn();
      writer.passed('Test passed');

      expect(writer.result).toHaveBeenCalledTimes(1);
      expect(writer.result.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('.failed()', () => {
    test('calls .result() with the right parameters', () => {
      chalk.__stripColors();

      const writer = create();

      writer.result = jest.fn();
      writer.failed('Test failed');

      expect(writer.result).toHaveBeenCalledTimes(1);
      expect(writer.result.mock.calls[0]).toEqual(['not ok', `${CIRCLE} Test failed`]);
    });

    test('colors "not ok" red', () => {
      chalk.__showTemplates();

      const writer = create();

      writer.result = jest.fn();
      writer.failed('Test failed');

      expect(writer.result).toHaveBeenCalledTimes(1);
      expect(writer.result.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('.skipped()', () => {
    test('calls .result() with the right parameters', () => {
      chalk.__stripColors();

      const writer = create();

      writer.result = jest.fn();
      writer.skipped('Test pending');

      expect(writer.result).toHaveBeenCalledTimes(1);
      expect(writer.result.mock.calls[0]).toEqual(['ok', '# SKIP Test pending']);
    });

    test('colors "ok" yellow', () => {
      chalk.__showTemplates();

      const writer = create();

      writer.result = jest.fn();
      writer.skipped('Test pending');

      expect(writer.result).toHaveBeenCalledTimes(1);
      expect(writer.result.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('.getPathRelativeToRoot()', () => {
    test('returns path relative to root folder', () => {
      const writer = create('/foo');
      const rel = writer.getPathRelativeToRoot('/foo/bar');

      expect(rel).toBe('bar');
    });
  });

  describe('.errors()', () => {
    test('logs using STDERR', () => {
      const writer = create();

      writer.logger.error = jest.fn();
      writer.errors(['Error: foobar']);

      expect(writer.logger.error).toHaveBeenCalledTimes(1);
    });

    test('strips "Error:" leading text', () => {
      chalk.__stripColors();

      const writer = create();

      writer.logger.error = jest.fn();
      writer.errors([
        'Error: foobar' +
        '\n' +
        'at Something (/foo/bar.js:10:10)'
      ]);

      expect(writer.logger.error).toHaveBeenCalledTimes(1);
      expect(writer.logger.error.mock.calls[0][0].includes('Error:')).toBe(false);
      expect(writer.logger.error.mock.calls[0][0].includes('foobar')).toBe(true);
    });

    test('format stack trace', () => {
      chalk.__stripColors();

      const writer = create();

      writer.logger.error = jest.fn();
      writer.errors([
        'Error: foobar' +
        '\n' +
        'at Something (/foo/bar.js:10:10)' +
        '\n' +
        'at Foobar (/foo/bar2.js:20:20)'
      ]);

      expect(writer.logger.error).toHaveBeenCalledTimes(1);
      expect(writer.logger.error.mock.calls[0][0]).not.toMatch('.*Stack trace.*');
      expect(writer.logger.error.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('.suite()', () => {
    test('prints test suite result', () => {
      chalk.__stripColors();

      const writer = create('/foo');

      writer.comment = jest.fn();
      writer.suite(true, '/foo/bar/', 'kappa.js');

      expect(writer.comment).toHaveBeenCalledTimes(1);
      expect(writer.comment.mock.calls[0][0]).toMatchSnapshot();
    });

    test('makes directory path relative', () => {
      chalk.__stripColors();

      const writer = create('/foo');

      writer.comment = jest.fn();
      writer.suite(true, '/foo/bar/', 'kappa.js');

      expect(writer.comment).toHaveBeenCalledTimes(1);

      const line = writer.comment.mock.calls[0][0];

      expect(line.includes('/foo/bar/kappa.js')).toBe(false);
      expect(line.includes('bar/kappa.js')).toBe(true);
    });
  });

  describe('.plan()', () => {
    test('prints test plan with supplied test count', () => {
      chalk.__stripColors();

      const writer = create();

      writer.logger.log = jest.fn();
      writer.plan(100);

      expect(writer.logger.log).toHaveBeenCalledTimes(1);
      expect(writer.logger.log.mock.calls[0][0]).toBe('1..100');
    });

    test('can be written only once', () => {
      const writer = create();

      writer.logger.log = jest.fn();
      writer.plan(100);
      expect(() => writer.plan(100)).toThrow(Error);
    });

    describe('when test count is not provided', () => {
      test('prints test plan using the current counter as test count', () => {
        chalk.__stripColors();

        const writer = create();

        writer.logger.log = jest.fn();
        writer.result('ok');
        writer.result('ok');
        writer.result('ok');
        writer.plan();

        expect(writer.logger.log).toHaveBeenCalledTimes(4);
        expect(writer.logger.log.mock.calls[3][0]).toBe('1..3');
      });
    });
  });

  describe('.aggregatedResults()', () => {
    test('all suites and tests pass', () => {
      const writer = create();
      const aggregatedResults = {
        numFailedTests: 0,
        numFailedTestSuites: 0,
        numPassedTests: 10,
        numPassedTestSuites: 2,
        numPendingTests: 0,
        numPendingTestSuites: 0,
        numTotalTests: 10,
        numTotalTestSuites: 2,
        snapshot: {},
        startTime: Date.now() - 2000
      };

      writer.stats = jest.fn();
      writer.aggregatedResults(aggregatedResults, 1);

      expect(writer.stats.mock.calls).toEqual([
        ['Test Suites', 0, 0, 2, 2],
        ['Tests', 0, 0, 10, 10]
      ]);
    });

    test('some suites and tests fail', () => {
      const writer = create();
      const aggregatedResults = {
        numFailedTests: 1,
        numFailedTestSuites: 1,
        numPassedTests: 10,
        numPassedTestSuites: 2,
        numPendingTests: 0,
        numPendingTestSuites: 0,
        numTotalTests: 10,
        numTotalTestSuites: 2,
        snapshot: {},
        startTime: Date.now() - 2000
      };

      writer.stats = jest.fn();
      writer.aggregatedResults(aggregatedResults, 1);

      expect(writer.stats.mock.calls).toEqual([
        ['Test Suites', 1, 0, 2, 2],
        ['Tests', 1, 0, 10, 10]
      ]);
    });

    test('1 suite failed to execute', () => {
      const writer = create();
      const aggregatedResults = {
        numFailedTests: 0,
        numFailedTestSuites: 1,
        numPassedTests: 10,
        numPassedTestSuites: 1,
        numPendingTests: 0,
        numPendingTestSuites: 0,
        numTotalTests: 10,
        numTotalTestSuites: 2,
        snapshot: {},
        startTime: Date.now() - 2000
      };

      writer.stats = jest.fn();
      writer.aggregatedResults(aggregatedResults, 1);

      expect(writer.stats.mock.calls).toEqual([
        ['Test Suites', 1, 0, 1, 2],
        ['Tests', 0, 0, 10, 10]
      ]);
    });

    test('some suites and tests skipped', () => {
      const writer = create();
      const aggregatedResults = {
        numFailedTests: 0,
        numFailedTestSuites: 0,
        numPassedTests: 5,
        numPassedTestSuites: 1,
        numPendingTests: 5,
        numPendingTestSuites: 1,
        numTotalTests: 10,
        numTotalTestSuites: 2,
        snapshot: {},
        startTime: Date.now() - 2000
      };

      writer.stats = jest.fn();
      writer.aggregatedResults(aggregatedResults, 1);

      expect(writer.stats.mock.calls).toEqual([
        ['Test Suites', 0, 1, 1, 2],
        ['Tests', 0, 5, 5, 10]
      ]);
    });
  });
});
