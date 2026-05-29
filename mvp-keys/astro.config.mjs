import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://rubyngo1610.github.io',
  build: {
    assets: '_assets',
  },
});
