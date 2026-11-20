#!/usr/bin/env node
/**
 * Remove the dev-only Sveltia CMS admin from the static export.
 *
 * public/admin/ is served by `next dev` for local authoring, and `next build`
 * copies public/ into out/ verbatim. The deployed artifact must not contain
 * the CMS, so run this after `npm run build` (or wire it into CI):
 *
 *   npm run build && npm run cms:strip
 *
 * Idempotent: running it when out/admin is already absent succeeds. It also
 * scans the rest of out/ for stray Sveltia assets (file or directory names)
 * and fails if any remain.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(repoRoot, "out");
const adminDir = path.join(outDir, "admin");

function fail(message) {
  console.error(`[cms:strip] ${message}`);
  process.exit(1);
}

function countFiles(directory) {
  let count = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    count += entry.isDirectory() ? countFiles(target) : 1;
  }
  return count;
}

function findSveltiaAssets(directory, relative = "") {
  const matches = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const childRelative = relative ? path.join(relative, entry.name) : entry.name;
    const target = path.join(directory, entry.name);
    if (/sveltia/i.test(entry.name)) {
      matches.push(childRelative);
      continue;
    }
    if (entry.isDirectory()) {
      matches.push(...findSveltiaAssets(target, childRelative));
    }
  }
  return matches;
}

if (!fs.existsSync(outDir) || !fs.statSync(outDir).isDirectory()) {
  fail("out/ does not exist. Run `npm run build` first.");
}

let removed = 0;
if (fs.existsSync(adminDir)) {
  removed = countFiles(adminDir);
  fs.rmSync(adminDir, { recursive: true, force: true });
}

if (fs.existsSync(adminDir)) fail("out/admin still exists after removal");

const stray = findSveltiaAssets(outDir);
if (stray.length > 0) {
  fail(
    `Sveltia assets remain outside out/admin:\n  ${stray.join("\n  ")}\n` +
      "Add them to scripts/strip-cms-from-export.mjs."
  );
}

console.log(
  removed === 0
    ? "[cms:strip] out/admin was already absent; out/ contains no Sveltia assets."
    : `[cms:strip] removed out/admin (${removed} files); out/ contains no Sveltia assets.`
);
