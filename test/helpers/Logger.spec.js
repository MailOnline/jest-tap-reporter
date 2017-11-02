const Logger = require('../../src/helpers/Logger');

test('Logger must set the INFO as the default level', () => {
  const logger = new Logger();

  expect(logger.getLevel()).toBe('INFO');
});

/* eslint-disable no-console */
test('Logger must use console.log as default log function', () => {
  const realLog = console.log;

  console.log = jest.fn();
  const logger = new Logger();

  logger.log('foo', 'bar');

  expect(console.log).toHaveBeenCalledTimes(1);
  expect(console.log).toHaveBeenCalledWith('foo', 'bar');

  console.log = realLog;
});
/* eslint-enable no-console */

test('Logger must be possible to pass a log function', () => {
  const log = jest.fn();
  const logger = new Logger({log});

  logger.log('foo', 'bar');

  expect(log).toHaveBeenCalledTimes(1);
  expect(log).toHaveBeenCalledWith('foo', 'bar');
});

test('Logger must be possible to pass a default log level', () => {
  const config = {
    logLevel: 'ERROR'
  };
  const logger = new Logger(config);

  expect(logger.getLevel()).toBe('ERROR');
});

test('Logger must be possible to change the log level', () => {
  const logger = new Logger();

  expect(logger.getLevel()).toBe('INFO');
  logger.setLevel('ERROR');
  expect(logger.getLevel()).toBe('ERROR');
  logger.setLevel('WARN');
  expect(logger.getLevel()).toBe('WARN');
});

test('Logger must throw if you try to change the level with an unknown one', () => {
  const logger = new Logger();

  expect(() => logger.setLevel('asfasdfsadf')).toThrow(TypeError);
  expect(() => logger.setLevel(23423)).toThrow(TypeError);
  expect(() => logger.setLevel()).toThrow(TypeError);
});

test('logger warn log must log no matter the log level', () => {
  const log = jest.fn();
  const logger = new Logger({
    log,
    logLevel: 'INFO'
  });

  logger.log('INFO');
  expect(log).toHaveBeenCalledWith('INFO');

  logger.setLevel('WARN');
  logger.log('WARN');
  expect(log).toHaveBeenCalledWith('WARN');

  logger.setLevel('ERROR');
  logger.log('ERROR');
  expect(log).toHaveBeenCalledWith('ERROR');

  expect(log).toHaveBeenCalledTimes(3);
});

test('logger info must log if log level is INFO', () => {
  const log = jest.fn();
  const logger = new Logger({
    log,
    logLevel: 'ERROR'
  });

  logger.info('test');
  expect(log).not.toHaveBeenCalled();

  logger.setLevel('WARN');
  logger.info('test');
  expect(log).not.toHaveBeenCalled();

  logger.setLevel('INFO');
  logger.info('test');
  expect(log).toHaveBeenCalledWith('test');

  expect(log).toHaveBeenCalledTimes(1);
});

test('logger WARN must log if log level is INFO or WARN', () => {
  const log = jest.fn();
  const logger = new Logger({
    log,
    logLevel: 'ERROR'
  });

  logger.warn('test');
  expect(log).not.toHaveBeenCalled();

  logger.setLevel('WARN');
  logger.warn('test');
  expect(log).toHaveBeenCalledWith('test');

  logger.setLevel('INFO');
  logger.warn('test2');
  expect(log).toHaveBeenCalledWith('test2');

  expect(log).toHaveBeenCalledTimes(2);
});

test('logger ERROR must log if log level is INFO or WARN or ERROR', () => {
  const log = jest.fn();
  const logger = new Logger({
    log,
    logLevel: 'ERROR'
  });

  logger.error('test');
  expect(log).toHaveBeenCalledWith('test');

  logger.setLevel('WARN');
  logger.error('test2');
  expect(log).toHaveBeenCalledWith('test2');

  logger.setLevel('INFO');
  logger.error('test3');
  expect(log).toHaveBeenCalledWith('test3');

  expect(log).toHaveBeenCalledTimes(3);
});
