/* eslint-disable filenames/match-exported */

const padEnd = require('string.prototype.padend');
const padStart = require('string.prototype.padstart');
const TapReporter = require('./src/TapReporter');

padEnd.shim();
padStart.shim();

module.exports = TapReporter;
