// @ts-check
import { defineConfig, passthroughImageService } from "astro/config";

import react from "@astrojs/react";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  image: {
      service: passthroughImageService(),
	},

  adapter: cloudflare({
    imageService: 'cloudflare'
 }),
});