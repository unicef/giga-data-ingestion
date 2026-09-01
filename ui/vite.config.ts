import { sentryVitePlugin } from "@sentry/vite-plugin";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { readFileSync } from "fs";
import * as path from "path";
import { defineConfig } from "vite";

const appVersion = (() => {
  try {
    return readFileSync(path.resolve(__dirname, "../VERSION"), "utf8").trim();
  } catch {
    return "0.0.0-dev";
  }
})();

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/api": {
        target: "http://api:8000",
        changeOrigin: true,
        secure: false,
      },
    },
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    },
  },
  build: {
    outDir: "build",
    sourcemap: "hidden",
  },
  plugins: [
    react(),
    TanStackRouterVite(),
    ...(process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT
      ? [
          sentryVitePlugin({
            url: process.env.SENTRY_URL,
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: {
              // Must match the release set in src/instrument.ts
              name: `giga-data-ingestion@${process.env.VITE_COMMIT_SHA}`,
            },
            sourcemaps: {
              filesToDeleteAfterUpload: ["build/**/*.map"],
            },
          }),
        ]
      : []),
  ],
});
