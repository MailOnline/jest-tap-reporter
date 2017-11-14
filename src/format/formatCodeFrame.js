const fs = require('fs');
const {codeFrameColumns} = require('@babel/code-frame');

const formatCodeFrame = (filePath, line, column, margin = 4) => {
  try {
    const source = fs.readFileSync(filePath, 'utf8');
    const location = {
      start: {
        column,
        line
      }
    };

    const formatted = codeFrameColumns(source, location, {
      highlightCode: true,
      linesAbove: margin,
      linesBelow: margin
    });

    // This below is because for some reason `@babel/code-frame` is not honoring
    // `linesBelow` setting.
    return formatted.split('\n').slice(0, 2 * margin + 1).join('\n');
  } catch (error) {
    return '';
  }
};

module.exports = formatCodeFrame;
