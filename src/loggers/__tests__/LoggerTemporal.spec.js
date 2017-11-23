const LoggerTemporal = require('../LoggerTemporal');

describe('LoggerTemporal', () => {
  it('is a function', () => {
    expect(typeof LoggerTemporal).toBe('function');
  });

  it('.temporary() throws if called before .buffer()', () => {
    const logger = new LoggerTemporal();

    expect(() => logger.temporary()).toThrow();
  });

  it('removes temporary output', () => {
    const stream = {
      clearLine: jest.fn(),
      cursorTo: jest.fn(),
      moveCursor: jest.fn(),
      write: jest.fn()
    };
    const logger = new LoggerTemporal({
      stream
    });

    logger.log('foo');

    logger.buffer();
    logger.temporary();
    logger.log('bar');

    logger.flush();

    logger.log('baz');

    expect(stream.write).toHaveBeenCalledWith('foo\n');
    expect(stream.write).toHaveBeenCalledWith('bar\n');
    expect(stream.write).toHaveBeenCalledWith('baz\n');

    expect(stream.cursorTo).toHaveBeenCalledTimes(1);
    expect(stream.clearLine).toHaveBeenCalledTimes(1);
    expect(stream.moveCursor).toHaveBeenCalledTimes(1);
  });
});
