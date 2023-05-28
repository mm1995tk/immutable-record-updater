import esbuild from 'esbuild';

esbuild.build({
  bundle: true,
  entryPoints: ['./src/index.ts'],
  outdir: './dist',
  platform: 'neutral',
  format: 'esm',
  minify: true,
  sourcemap: true,
  treeShaking: true,
});
