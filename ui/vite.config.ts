import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
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
    },
    plugins: [
      react(),
      // Only enable route generation in dev mode (serve command)
      // Disable during build to prevent route regeneration loops
      ...(command === "serve"
        ? [
            TanStackRouterVite({
              routesDirectory: "./src/routes",
              generatedRouteTree: "./src/routeTree.gen.ts",
              autoCodeSplitting: true,
            }),
          ]
        : []),
    ],
  };
});
