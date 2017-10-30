const failingTestSuite = require('./failingTestSuite.json');
const passingTestSuite = require('./passingTestSuite.json');
const severalTestsSuite = require('./severalTestsSuite.json');
const skippedTestSuite = require('./skippedTestSuite.json');

const fixtures = {
  failingTestSuite,
  passingTestSuite,
  severalTestsSuite,
  skippedTestSuite
};

module.exports = fixtures;
