/* eslint-disable import/newline-after-import */
import typescript from 'rollup-plugin-typescript';
const pkg = require('./package.json');

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  entry: './main.ts',
  plugins: [
    typescript()
  ],
  targets: [
    {
      dest: pkg.main,
      format: 'cjs',
      sourceMap: true
    },
    {
      dest: pkg.module,
      format: 'es',
      sourceMap: true
    }
  ]
};
