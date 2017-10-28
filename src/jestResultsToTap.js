const jestResultsToTap = (results) => {
  const text = [
    `1..${results.numTotalTests}`
  ];

  const tests = results.testResults
    .map((suite) => suite.testResults)
    .reduce((memo, testResults) => [...memo, ...testResults], []);

  tests.forEach((test, idx) => {
    if (test.status === 'passed') {
      text.push(`ok ${idx + 1} ${test.title}`);
    } else if (test.status === 'failed') {
      text.push(`not ok ${idx + 1} ${test.title}`);

      if (test.failureMessages.length > 0) {
        const diagnostics = test.failureMessages
          .reduce((lines, msg) => lines.concat(msg.split('\n')), [])
          .map((line) => `# ${line}`)
          .join('\n');

        text.push(diagnostics);
      }
    } else if (test.status === 'pending') {
      text.push(`ok ${idx + 1} ${test.title} # SKIP -`);
    }
  });

  text.push(`# tests ${results.numTotalTests}`);
  text.push(`# pass ${results.numPassedTests}`);
  text.push(`# fail ${results.numFailedTests}`);

  return text.join('\n');
};

module.exports = jestResultsToTap;
