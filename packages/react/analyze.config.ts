import { createJSONPlugin } from '@maverick-js/cli/analyze';

export default [
  createJSONPlugin({
    outFile: 'dist-npm/analyze.json',
  }),
];
