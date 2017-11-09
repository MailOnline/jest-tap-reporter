/* eslint-disable id-match */
const stripAnsi = require('strip-ansi');

const chalkActual = require.requireActual('chalk');

const chalk = jest.fn();

chalk.__useActual = () => {
  chalk.mockImplementation(chalkActual);
};

chalk.__showTemplates = () => {
  chalk.mockImplementation((templates, ...rest) => {
    let str = '';

    for (let index = 0; index < rest.length; index++) {
      str += templates[index] + rest[index];
    }

    return str + templates[templates.length - 1];
  });
};

chalk.__stripColors = () => {
  chalk.mockImplementation((...args) => {
    const formatted = chalkActual(...args);

    return stripAnsi(formatted);
  });
};

chalk.__stripColors();

module.exports = chalk;
