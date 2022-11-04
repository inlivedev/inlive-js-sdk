import dts from 'rollup-plugin-dts'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'

const config = [
  {
    input: 'packages/index.js',
    output: [
      {
        file: 'dist/inlive-js-sdk.js',
        format: 'es',
        sourcemap: true,
      },
    ],
    external: ['node-fetch'],
    plugins: [nodeResolve(), commonjs(), terser()],
    watch: {
      include: 'packages/**',
      exclude: 'packages/**/*.test.js',
    },
  },
  {
    input: 'packages/index.js',
    output: [
      {
        file: 'dist/inlive-js-sdk.d.ts',
        format: 'es',
      },
    ],
    plugins: [dts()],
    watch: {
      include: 'packages/**',
      exclude: 'packages/**/*.test.js',
    },
  },
]

export default config
