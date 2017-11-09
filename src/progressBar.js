const chalk = require('chalk');
const bar = require('utf8-bar');

const progressBar = (percentage, styles = 'grey') => chalk`{${styles} ${bar(20, percentage)}}`;

export default progressBar;
