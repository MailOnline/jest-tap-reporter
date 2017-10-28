const {
  failingTestJsonOutput,
  severalTestsJsonOutputs,
  singleTestJsonOutput,
  skippedTestJsonOutput
} = require('./raw');

const fixtures = {
  failingTestResult: JSON.parse(failingTestJsonOutput),
  severalTestResults: JSON.parse(severalTestsJsonOutputs),
  singleTestResult: JSON.parse(singleTestJsonOutput),
  skippedTestResult: JSON.parse(skippedTestJsonOutput)
};

module.exports = fixtures;
