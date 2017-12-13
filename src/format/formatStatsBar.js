const chalk = require('chalk');
const padEnd = require('string.prototype.padend');
const padStart = require('string.prototype.padstart');
const progressBar = require('../progressBar');

const formatStatsBar = (percent, hasErrors) => {
  let percentFormatted = Math.round(100 * percent) + '%';

  percentFormatted = padStart(percentFormatted, 3, ' ');
  percentFormatted = padEnd(percentFormatted, 4, ' ');

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
