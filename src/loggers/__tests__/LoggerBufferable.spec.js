/* eslint-disable max-nested-callbacks */
const Logger = require('../Logger');
const LoggerBufferable = require('../LoggerBufferable');

jest.mock('../Logger');

describe('LoggerBufferable', () => {
  it('is a function', () => {
    expect(typeof LoggerBufferable).toBe('function');
  });

  it('extends Logger', () => {
    const logger = new LoggerBufferable();

    expect(logger instanceof Logger).toBe(true);
  });

  describe('.log()', () => {
    it('calls parent log()', () => {
      Logger.prototype.log.mockClear();

      const lb = new LoggerBufferable();

      lb.log('foo');

      expect(Logger.prototype.log).toHaveBeenCalledTimes(1);
      expect(Logger.prototype.log).toHaveBeenCalledWith('foo');
    });
  });

  describe('.write()', () => {
    it('calls parent write()', () => {
      Logger.prototype.write.mockClear();

      const lb = new LoggerBufferable();

      lb.write('foo');

      expect(Logger.prototype.write).toHaveBeenCalledTimes(1);
      expect(Logger.prototype.write).toHaveBeenCalledWith('foo');
    });
  });

  describe('.buffer()', () => {
    describe('when buffering', () => {
      it('does not call parent write()', () => {
        Logger.prototype.write.mockClear();

        const lb = new LoggerBufferable();

        lb.buffer();
        lb.write('foo');

        expect(Logger.prototype.write).toHaveBeenCalledTimes(0);
      });

      describe('on flush', () => {
        it('flushes all buffered output', () => {
          Logger.prototype.write.mockClear();

          const lb = new LoggerBufferable();

          lb.buffer();
          lb.write('foo');
          lb.write('bar');
          lb.flush();

          expect(Logger.prototype.write).toHaveBeenCalledTimes(1);
          expect(Logger.prototype.write).toHaveBeenCalledWith('foobar');
        });

        it('continues to write without buffering', () => {
          Logger.prototype.write.mockClear();

          const lb = new LoggerBufferable();

          lb.buffer();
          lb.write('foo');
          lb.write('bar');
          lb.flush();
          lb.write('baz');

          expect(Logger.prototype.write).toHaveBeenCalledTimes(2);
          expect(Logger.prototype.write).toHaveBeenCalledWith('foobar');
          expect(Logger.prototype.write).toHaveBeenCalledWith('baz');
        });
      });
    });
  });
});
