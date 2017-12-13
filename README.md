# jest-tap-reporter

[travis-badge]: https://api.travis-ci.org/MailOnline/jest-tap-reporter.svg?branch=master
[travis]: https://travis-ci.org/MailOnline/jest-tap-reporter
[npm-badge]: https://img.shields.io/npm/v/jest-tap-reporter.svg
[npm]: https://www.npmjs.com/package/jest-tap-reporter
[license-badge]: https://img.shields.io/badge/license-MIT-orange.svg
[license]: ./LICENSE
[tap]: https://testanything.org/tap-specification.html
[jest]: https://facebook.github.io/jest/

[![jest-tap-reporter on NPM][npm-badge]][npm] [![Travis CI][travis-badge]][travis] [![License][license-badge]][license] [![Greenkeeper badge](https://badges.greenkeeper.io/MailOnline/jest-tap-reporter.svg)](https://greenkeeper.io/)

[TAP][tap] reporter for [Jest][jest].

  - Outputs valid TAP
  - Highlights similar to Jest default reporter, see [Mac](./docs/example-mac.png) and [VS Code](./docs/example-vscode.png) examples
  - [Highlights line and column of errors](./docs/highlight.png)
  - [Shows progress](./docs/progress.png) while running tests

## Installation

#### yarn

```shell
yarn add --dev jest-tap-reporter
```

#### npm

```shell
npm install --dev jest-tap-reporter
```

## Usage

#### Add to your Jest configuration

```javascript
{
  "reporters": [
    "jest-tap-reporter"
  ]
}
```

#### Options

You can add an optional configuration object:

```javascript
{
  "reporters": [
    ["jest-tap-reporter", {
      "logLevel": "ERROR",
      "showInternalStackTraces": true,
      "filePath": "filename.tap"
    }]
  ]
}
```

Options:

  - `logLevel` - specifies the log level. By default jest-tap-reporter uses `INFO` log level, which will log the suite path and a summary at the end of a test run. If you want to reduce the reporting to bare minimum you can set the `logLevel` parameter to `ERROR`. available log levels are: `ERROR`, `WARN`, `INFO`.
  - `showInternalStackTraces` - shows stack traces from *"internal"* folders, like `/node_modules` and `/internal`, defaults to `false`.
  - `filePath` - specifies a file to write the results. If not supplied it will use `process.stdout`.

## License

[MIT](./LICENSE).
