import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts'
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node20',
  bundle: true,
  platform: 'node',
  external: ['node:*'],
  inputOptions: {
    resolve: {
      extensions: ['.ts', '.js']
    }
  }
})
