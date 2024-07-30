import * as path from "node:path";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
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
      Pragma: "no-cache",
    },
  },
  build: {
    outDir: "build",
  },
  plugins: [react(), TanStackRouterVite()],
});
