const chalk = require('chalk');

const formatFailureMessageTraceLine = (description, relativeFilePath, row, column) =>
  chalk`${description}({cyan ${relativeFilePath}}:{black.bold ${row}}:{black.bold ${column}})`;

module.exports = formatFailureMessageTraceLine;
