const index = require('../index');
const TapReport = require('../src/TapReporter');

test('index must export TapReport', () => {
  expect(index).toBe(TapReport);
});

// eslint-disable-next-line jest/no-disabled-tests
xit('a sample todo test', () => {});
