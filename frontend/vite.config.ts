import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

/**
 * Le service worker MSW (mode maquette) vit dans public/ pour le serveur de
 * dev, mais ne doit jamais partir en production : on le retire de dist/.
 */
function stripMockServiceWorker(): Plugin {
  let outDir = "dist";
  return {
    name: "lumio-strip-msw",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      fs.rmSync(path.join(outDir, "mockServiceWorker.js"), { force: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), stripMockServiceWorker()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3100,
    proxy: {
      "/api": {
        target: "http://localhost:8100",
        changeOrigin: true,
      },
    },
  },
});
