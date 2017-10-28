const jestResultsToTap = require('../src/jestResultsToTap');
const {
  failingTestResult,
  severalTestResults,
  singleTestResult,
  skippedTestResult
} = require('./fixtures');

const string = {
  any: expect.stringMatching(/.*/),
  empty: expect.stringMatching(/(^$)|(\s+$)/),
  // eslint-disable-next-line no-useless-escape
  startsWith: (query) => expect.stringMatching(new RegExp('^' + query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')))
};

const processTestOutput = (output) => {
  const parts = output.split('\n');

  const testLines = parts
    .slice(1, parts.length - 3)
    .reduce((lines, line) => {
      if (line.indexOf('#') === 0) {
        const currentLine = lines[lines.length - 1];

        lines[lines.length - 1] = currentLine.concat('\n').concat(line);
      } else {
        lines.push(line);
      }

      return lines;
    }, []);

  return {
    plan: parts[0],
    testLines
  };
};

const processTestLine = (testLine) => {
  const parts = testLine.split(' ');
  const isSuccess = testLine.indexOf('not') !== 0;
  const status = isSuccess ? parts[0] : `${parts[0]} ${parts[1]}`;
  const testNumber = isSuccess ? parts[1] : parts[2];
  const hasDirective = testLine.indexOf('# SKIP -') >= 0;
  const descriptionStartIdx = isSuccess ? 2 : 3;

  let description;
  let directive;
  let diagnostics;

  if (hasDirective) {
    const directiveStartIdx = parts.indexOf('#');

    description = parts.slice(descriptionStartIdx, directiveStartIdx).join(' ');
    directive = parts.slice(directiveStartIdx).join(' ');
  } else {
    description = parts.slice(descriptionStartIdx).join(' ');
    directive = null;
  }

  const descriptionsParts = description.split('\n');

  if (descriptionsParts.length > 1) {
    description = descriptionsParts[0];
    diagnostics = descriptionsParts.slice(1);
  } else {
    diagnostics = null;
  }

  return {
    description,
    diagnostics,
    directive,
    status,
    testNumber
  };
};

describe('mol-fe-jest-tap-results-processor', () => {
  it('must output the plan', () => {
    let tapResult = jestResultsToTap(singleTestResult);

    expect(tapResult).toEqual(string.startsWith('1..1'));

    tapResult = jestResultsToTap(severalTestResults);

    expect(tapResult).toEqual(string.startsWith('1..7'));
  });

  it('must properly output success test lines', () => {
    const tapResult = jestResultsToTap(severalTestResults);
    const output = processTestOutput(tapResult);

    output.testLines.forEach((testLine, idx) => {
      const {
        description,
        directive,
        status,
        testNumber
      } = processTestLine(testLine);

      expect(status).toBe('ok');
      expect(testNumber).toBe(String(idx + 1));
      expect(description).not.toBe(string.notEmpty);
      expect(directive).toBeNull();
    });
  });

  it('must properly output error test lines', () => {
    const tapResult = jestResultsToTap(failingTestResult);
    const output = processTestOutput(tapResult);
    const testLine = output.testLines[0];

    const {
      description,
      diagnostics,
      directive,
      status,
      testNumber
    } = processTestLine(testLine);

    expect(status).toBe('not ok');
    expect(testNumber).toBe('1');
    expect(description).not.toBe(string.notEmpty);
    expect(directive).toBeNull();
    expect(diagnostics.length > 0).toBe(true);

    diagnostics.forEach((diagnosticsLine) => {
      expect(diagnosticsLine).toEqual(string.startsWith('# '));
    });
  });

  it('must add the skiped directive to skiped test lines', () => {
    const tapResult = jestResultsToTap(skippedTestResult);
    const output = processTestOutput(tapResult);

    const testLine = output.testLines[0];
    const {
      description,
      directive,
      status,
      testNumber
    } = processTestLine(testLine);

    expect(status).toBe('ok');
    expect(testNumber).toBe('1');
    expect(description).not.toBe(string.notEmpty);
    expect(directive).toBe('# SKIP -');
  });
});
