const index = require('../../index');
const TapReport = require('../TapReporter');

test('index must export TapReport', () => {
  expect(index).toBe(TapReport);
});
