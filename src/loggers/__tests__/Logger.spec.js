const Logger = require('../Logger');

describe('Logger', () => {
  test('must set the INFO as the default level', () => {
    const logger = new Logger();

    expect(logger.getLevel()).toBe('INFO');
  });

  test('must use process.stdout as a default ouput stream', () => {
    const logger = new Logger();

    expect(logger.stream).toBe(process.stdout);
  });

  test('must be possible to pass the output stream', () => {
    const stream = {
      write: jest.fn()
    };
    const logger = new Logger({stream});

    logger.log('foo', 'bar');

    expect(stream.write).toHaveBeenCalledTimes(1);
    expect(stream.write).toHaveBeenCalledWith('foo bar\n');
  });

  test('must be possible to pass a default log level', () => {
    const config = {
      logLevel: 'ERROR'
    };
    const logger = new Logger(config);

    expect(logger.getLevel()).toBe('ERROR');
  });

  test('must be possible to change the log level', () => {
    const logger = new Logger();

    expect(logger.getLevel()).toBe('INFO');
    logger.setLevel('ERROR');
    expect(logger.getLevel()).toBe('ERROR');
    logger.setLevel('WARN');
    expect(logger.getLevel()).toBe('WARN');
  });

  test('must throw if you try to change the level with an unknown one', () => {
    const logger = new Logger();

    expect(() => logger.setLevel('asfasdfsadf')).toThrow(Error);
    expect(() => logger.setLevel(23423)).toThrow(TypeError);
    expect(() => logger.setLevel()).toThrow(TypeError);
  });

  test('warn log must log no matter the log level', () => {
    const write = jest.fn();
    const logger = new Logger({
      logLevel: 'INFO',
      stream: {
        write
      }
    });

    logger.log('INFO');
    expect(write).toHaveBeenCalledWith('INFO\n');

    logger.setLevel('WARN');
    logger.log('WARN');
    expect(write).toHaveBeenCalledWith('WARN\n');

    logger.setLevel('ERROR');
    logger.log('ERROR');
    expect(write).toHaveBeenCalledWith('ERROR\n');

    expect(write).toHaveBeenCalledTimes(3);
  });

  test('info must log if log level is INFO', () => {
    const write = jest.fn();
    const logger = new Logger({
      logLevel: 'ERROR',
      stream: {
        write
      }
    });

    logger.info('test');
    expect(write).not.toHaveBeenCalled();

    logger.setLevel('WARN');
    logger.info('test');
    expect(write).not.toHaveBeenCalled();

    logger.setLevel('INFO');
    logger.info('test');
    expect(write).toHaveBeenCalledWith('test\n');

    expect(write).toHaveBeenCalledTimes(1);
  });

  test('WARN must log if log level is INFO or WARN', () => {
    const write = jest.fn();
    const logger = new Logger({
      logLevel: 'ERROR',
      stream: {
        write
      }
    });

    logger.warn('test');
    expect(write).not.toHaveBeenCalled();

    logger.setLevel('WARN');
    logger.warn('test');
    expect(write).toHaveBeenCalledWith('test\n');

    logger.setLevel('INFO');
    logger.warn('test2');
    expect(write).toHaveBeenCalledWith('test2\n');

    expect(write).toHaveBeenCalledTimes(2);
  });

  test('ERROR must log if log level is INFO or WARN or ERROR', () => {
    const write = jest.fn();
    const logger = new Logger({
      logLevel: 'ERROR',
      stream: {
        write
      }
    });

    logger.error('test');
    expect(write).toHaveBeenCalledWith('test\n');

    logger.setLevel('WARN');
    logger.error('test2');
    expect(write).toHaveBeenCalledWith('test2\n');

    logger.setLevel('INFO');
    logger.error('test3');
    expect(write).toHaveBeenCalledWith('test3\n');

    expect(write).toHaveBeenCalledTimes(3);
  });

  describe('.write()', () => {
    it('must write to the stream', () => {
      const write = jest.fn();
      const logger = new Logger({
        stream: {
          write
        }
      });

      logger.write('lol');

      expect(write).toHaveBeenCalledTimes(1);
      expect(write).toHaveBeenCalledWith('lol');
    });
  });

  describe('.log()', () => {
    it('must call .write() with extra \\n', () => {
      const write = jest.fn();
      const logger = new Logger({
        stream: {
          write
        }
      });

      logger.write = jest.fn();

      logger.log('foo');

      expect(logger.write).toHaveBeenCalledTimes(1);
      expect(logger.write).toHaveBeenCalledWith('foo\n');
    });
  });
});
