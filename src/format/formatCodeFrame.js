const fs = require('fs');
const {codeFrameColumns} = require('@babel/code-frame');

const formatCodeFrame = (filePath, line, column) => {
  try {
    const source = fs.readFileSync(filePath, 'utf8');
    const location = {
      start: {
        column,
        line
      }
    };

    return codeFrameColumns(source, location, {
      highlightCode: true,
      linesAbove: 4,
      linesBelow: 4
    });
  } catch (error) {
    return '';
  }
};

module.exports = formatCodeFrame;
