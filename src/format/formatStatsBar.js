const chalk = require('chalk');
const progressBar = require('../progressBar');

const formatStatsBar = (percent, hasErrors) => {
  let percentFormatted = Math.round(100 * percent) + '%';

  percentFormatted = percentFormatted.padStart(3, ' ');
  percentFormatted = percentFormatted.padEnd(4, ' ');

  const bar = progressBar(percent, hasErrors ? 'red' : 'grey.dim');

  let textStyles = 'green';

  if (hasErrors) {
    textStyles = 'red.bold';
  } else if (percent < 1) {
    textStyles = 'yellow';
  }

  return chalk`{${textStyles} ${percentFormatted}} ${bar}`;
};

module.exports = formatStatsBar;
