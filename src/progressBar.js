const chalk = require('chalk');
const bar = require('utf8-bar');

const progressBar = (percentage, styles = 'grey') => chalk`{${styles} ${bar(10, percentage)}}`;

module.exports = progressBar;
