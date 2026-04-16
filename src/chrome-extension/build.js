const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const isWatch = process.argv.includes("--watch");

const outdir = path.join(__dirname, "dist");

// Ensure output directory exists
if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

// Copy static files
const publicDir = path.join(__dirname, "public");
for (const file of fs.readdirSync(publicDir)) {
  const src = path.join(publicDir, file);
  const dest = path.join(outdir, file);
  if (fs.statSync(src).isDirectory()) {
    fs.cpSync(src, dest, { recursive: true });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log("Copied public files to dist/");

// Create placeholder icons
const iconsDir = path.join(outdir, "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Simple 1x1 green PNG for placeholder icons
const greenPixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+G+4HgAD+AH/b8Q7CAAAAABJRU5ErkJggg==",
  "base64"
);

for (const size of [16, 32, 48, 128]) {
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), greenPixel);
}
console.log("Created placeholder icons");

// Build TypeScript files (ESM for extension scripts)
const buildOptions = {
  entryPoints: [
    path.join(__dirname, "src/background.ts"),
    path.join(__dirname, "src/content.ts"),
    path.join(__dirname, "src/popup.ts"),
  ],
  bundle: true,
  outdir,
  format: "esm",
  target: "es2020",
  minify: !isWatch,
  sourcemap: isWatch,
};

// Build injected.ts as IIFE (runs in page context)
const injectedBuildOptions = {
  entryPoints: [path.join(__dirname, "src/injected.ts")],
  bundle: true,
  outdir,
  format: "iife",
  target: "es2020",
  minify: !isWatch,
  sourcemap: isWatch,
};

if (isWatch) {
  Promise.all([
    esbuild.context(buildOptions),
    esbuild.context(injectedBuildOptions),
  ]).then(([ctx1, ctx2]) => {
    ctx1.watch();
    ctx2.watch();
    console.log("Watching for changes...");
  });
} else {
  Promise.all([
    esbuild.build(buildOptions),
    esbuild.build(injectedBuildOptions),
  ]).then(() => {
    console.log("Build complete!");
  });
}
