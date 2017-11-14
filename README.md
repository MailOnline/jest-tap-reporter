# jest-tap-reporter

[travis-badge]: https://api.travis-ci.org/MailOnline/jest-tap-reporter.svg?branch=master
[travis]: https://travis-ci.org/MailOnline/jest-tap-reporter
[npm-badge]: https://img.shields.io/npm/v/jest-tap-reporter.svg
[npm]: https://www.npmjs.com/package/jest-tap-reporter
[license-badge]: https://img.shields.io/badge/license-MIT-orange.svg
[license]: ./LICENSE

[![jest-tap-reporter on NPM][npm-badge]][npm] [![Travis CI][travis-badge]][travis] [![License][license-badge]][license]

Jest reporter that outputs valid [TAP](https://testanything.org/tap-specification.html) output and highlights similar to Jest's default reporter.


Mac terminal sample output:

![jest-tap-reporter exaple Mac](./docs/example-mac.png)

VS Code sample output:

![jest-tap-reporter exaple VS Code](./docs/example-vscode.png)

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

#### Add to your jest configuration

```javascript
{
  "reporters": [
    "jest-tap-reporter"
  ]
}
```

#### Log levels

By default jest-tap-reporter uses `INFO` log level, which will log the suite path and a summary at the end of a test run.
If you want to reduce the reporting to bare minimum you can set the `logLevel` parameter to `ERROR`.

```javascript
{
  "reporters": [
    ["jest-tap-reporter", {"logLevel": "ERROR"}]
  ]
}
```

Available log levels are: `ERROR`, `WARN`, `INFO`.

## License

MIT, see [LICENSE](./LICENSE).
