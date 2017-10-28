const index = require('../index');
const TapReport = require('../src/TapReporter');

test('index must export TapReport', () => {
  expect(index).toBe(TapReport);
});
