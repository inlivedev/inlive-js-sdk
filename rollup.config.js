/* eslint-disable camelcase */
import dts from 'rollup-plugin-dts'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'

const external = ['node-fetch']
const plugins = [
  nodeResolve(),
  commonjs(),
  terser({
    sourceMap: {
      url: 'inline',
    },
    ecma: '2017',
    keep_classnames: true,
    keep_fnames: true,
  }),
]

const config = [
  {
    input: 'packages/index.js',
    output: {
      file: 'dist/inlive-js-sdk.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: plugins,
    external: external,
    watch: {
      include: 'packages/app/**',
      exclude: 'packages/app/**/*.test.js',
    },
  },
  {
    input: 'packages/event/index.js',
    output: {
      file: 'dist/event.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: plugins,
    external: external,
    watch: {
      include: 'packages/event/**',
      exclude: 'packages/event/**/*.test.js',
    },
  },
  {
    input: 'packages/stream/index.js',
    output: {
      file: 'dist/stream.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: plugins,
    external: external,
    watch: {
      include: 'packages/stream/**',
      exclude: 'packages/stream/**/*.test.js',
    },
  },
  {
    input: 'packages/player/player.js',
    output: {
      file: 'dist/player.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: plugins,
    external: external,
    watch: {
      include: 'packages/player/**',
      exclude: 'packages/player/**/*.test.js',
    },
  },
  {
    input: 'packages/index.js',
    output: [
      {
        file: 'dist/inlive-js-sdk.d.ts',
        format: 'es',
        sourcemap: true,
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
