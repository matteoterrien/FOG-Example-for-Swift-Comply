import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "https://city.swiftcomply.com",
        changeOrigin: true,
      },
    },
  },
});
