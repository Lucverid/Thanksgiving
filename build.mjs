import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();
const dist = path.join(root, "dist");

// Hapus dist lama
fs.rmSync(dist, { recursive: true, force: true });

// Bikin dist baru
fs.mkdirSync(dist, { recursive: true });

// File/folder yang jangan dicopy mentah
const skip = new Set([
  ".git",
  "node_modules",
  "dist",
  "build.mjs",
  "package.json",
  "package-lock.json",
  "app.js",
  "styles.css"
]);

// Copy semua file lain ke dist
for (const name of fs.readdirSync(root)) {
  if (skip.has(name)) continue;

  fs.cpSync(
    path.join(root, name),
    path.join(dist, name),
    { recursive: true }
  );
}

// Windows pakai npx.cmd
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

console.log("🔧 Minify app.js...");

execSync(
  `${npx} terser app.js -c -m -o dist/app.js`,
  {
    stdio: "inherit",
    cwd: root,
    shell: true
  }
);

console.log("🎨 Minify styles.css...");

execSync(
  `${npx} cleancss -o dist/styles.css styles.css`,
  {
    stdio: "inherit",
    cwd: root,
    shell: true
  }
);

console.log("");
console.log("✅ Production build selesai!");
console.log("📁 Hasil ada di folder dist/");