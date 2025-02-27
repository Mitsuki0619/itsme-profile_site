// @ts-check
import { defineConfig, passthroughImageService } from "astro/config";

import react from "@astrojs/react";

import cloudflare from "@astrojs/cloudflare";

import sitemap from "@astrojs/sitemap";

const compilerConfig = {
  target: "18",
};

// https://astro.build/config
export default defineConfig({
  integrations: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", compilerConfig]],
      },
    }),
    sitemap(),
  ],
  build: {
    inlineStylesheets: "auto",
  },
  image: {
    service: passthroughImageService(),
  },
  adapter: cloudflare(),
  vite: {
    build: {
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            three: ["three"],
          },
        },
      },
    },
    ssr: {
      noExternal: ["react-spring"],
    },
  },
});
