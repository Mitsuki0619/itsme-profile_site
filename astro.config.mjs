// @ts-check
import { defineConfig, passthroughImageService } from "astro/config";

import react from "@astrojs/react";

import cloudflare from "@astrojs/cloudflare";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), sitemap()],

  image: {
      service: passthroughImageService(),
    },

  adapter: cloudflare(),
});