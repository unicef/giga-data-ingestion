import { cpSync, mkdirSync } from "node:fs";
import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.tsx"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/index.mjs",
  packages: "external",
});

mkdirSync("dist/templates", { recursive: true });
cpSync("src/templates", "dist/templates", { recursive: true });
