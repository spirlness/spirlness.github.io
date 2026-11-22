#!/usr/bin/env node
/**
 * Vendor the Sveltia CMS browser bundle into public/admin/ so the CMS is
 * served from this repository instead of a CDN.
 *
 * public/admin/ is generated and gitignored:
 *   dist/sveltia-cms.js   -> public/admin/sveltia-cms.js
 *   dist/chunks/**        -> public/admin/chunks/**   (lazy feature chunks, no .map)
 *   locales/*.json        -> public/admin/locales/*.json
 *   scripts/cms-admin/index.html -> public/admin/index.html
 *   scripts/cms-admin/preview.js -> public/admin/preview.js (when present)
 *
 * The stock bundle lazy-loads non-English UI strings from a hard-coded unpkg
 * URL. The copied bundle is rewritten (exactly once) to load ./locales
 * instead; the script fails loudly if a package upgrade ever changes that
 * snippet. Optional heavy preview libraries (PDF.js, HEIC, etc.) are still
 * resolved lazily from unpkg by the upstream bundle; they are only requested
 * when those preview features are used and are not part of the admin shell.
 *
 * Also validates the generated public/admin/config.yml: the YAML must parse,
 * the backend must be the local GitHub partition, and every referenced folder
 * (collection folders and media folders, including `{{slug}}` templates) must
 * exist.
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const adminDir = path.join(repoRoot, "public", "admin");
const templateDir = path.join(repoRoot, "scripts", "cms-admin");
const require = createRequire(import.meta.url);

function fail(message) {
  console.error(`[cms:sync] ${message}`);
  process.exit(1);
}

function ensureDirectory(target, label) {
  let stats;
  try {
    stats = fs.statSync(target);
  } catch {
    fail(`${label} does not exist: ${target}`);
  }
  if (!stats.isDirectory()) fail(`${label} is not a directory: ${target}`);
}

function stripSourceMapHints(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      stripSourceMapHints(target);
    } else if (entry.name.endsWith(".js")) {
      const source = fs.readFileSync(target, "utf8");
      const stripped = source.replace(/\s*\/\/# sourceMappingURL=[^\r\n]*\s*$/, "");
      if (stripped !== source) fs.writeFileSync(target, stripped);
    }
  }
}

async function copyChunks(distDir) {
  const source = path.join(distDir, "chunks");
  const destination = path.join(adminDir, "chunks");
  if (!fs.existsSync(source)) fail(`Sveltia package is missing dist/chunks: ${source}`);
  await fsp.rm(destination, { recursive: true, force: true });
  await fsp.cp(source, destination, {
    recursive: true,
    filter: (src) => !src.endsWith(".map"),
  });
  // Source maps are not vendored; drop the dangling lookup hints.
  stripSourceMapHints(destination);
}

async function copyLocales(packageDir) {
  const source = path.join(packageDir, "locales");
  const destination = path.join(adminDir, "locales");
  if (!fs.existsSync(source)) fail(`Sveltia package is missing locales/: ${source}`);
  await fsp.rm(destination, { recursive: true, force: true });
  await fsp.cp(source, destination, {
    recursive: true,
    filter: (src) => fs.statSync(src).isDirectory() || src.endsWith(".json"),
  });
}

async function vendorBundle(packageDir, version) {
  const bundleSource = path.join(packageDir, "dist", "sveltia-cms.js");
  const bundleTarget = path.join(adminDir, "sveltia-cms.js");
  if (!fs.existsSync(bundleSource)) {
    fail(`Sveltia package is missing dist/sveltia-cms.js: ${bundleSource}`);
  }
  await fsp.copyFile(bundleSource, bundleTarget);

  // Keep locale loading local. The unpkg base URL is a single literal in the
  // bundle; refuse to continue if upstream changes it so we never silently
  // regress to CDN locale fetches.
  const localeCdn = `https://unpkg.com/@sveltia/cms@${version}/locales`;
  let bundle = await fsp.readFile(bundleTarget, "utf8");
  const occurrences = bundle.split(localeCdn).length - 1;
  if (occurrences !== 1) {
    fail(
      `expected exactly one locale CDN reference (${localeCdn}) in the Sveltia bundle, found ${occurrences}. ` +
        "Check the package upgrade and update scripts/sync-sveltia-admin.mjs."
    );
  }
  bundle = bundle.replace(localeCdn, "./locales");
  // Source maps are not vendored; drop the dangling lookup hint.
  bundle = bundle.replace(/\s*\/\/# sourceMappingURL=[^\r\n]*\s*$/, "");
  await fsp.writeFile(bundleTarget, bundle);

  const licenseSource = path.join(packageDir, "LICENSE.txt");
  if (fs.existsSync(licenseSource)) {
    await fsp.copyFile(licenseSource, path.join(adminDir, "LICENSE.sveltia.txt"));
  }
}

async function copyAdminTemplates() {
  const indexSource = path.join(templateDir, "index.html");
  if (!fs.existsSync(indexSource)) fail(`missing admin template: ${indexSource}`);
  const indexHtml = await fsp.readFile(indexSource, "utf8");
  if (!indexHtml.includes("./sveltia-cms.js")) {
    fail("scripts/cms-admin/index.html must load ./sveltia-cms.js");
  }
  await fsp.copyFile(indexSource, path.join(adminDir, "index.html"));

  const previewSource = path.join(templateDir, "preview.js");
  const previewTarget = path.join(adminDir, "preview.js");
  if (fs.existsSync(previewSource)) {
    if (!indexHtml.includes("./preview.js")) {
      fail("scripts/cms-admin/index.html must load ./preview.js when the template exists");
    }
    await fsp.copyFile(previewSource, previewTarget);
  } else {
    await fsp.rm(previewTarget, { force: true });
  }
}

/**
 * A media folder may contain `{{slug}}`-style tags; the static prefix before
 * the first tag must still name an existing directory.
 */
function staticFolderPrefix(folder) {
  const marker = folder.indexOf("{{");
  const staticPart = marker === -1 ? folder : folder.slice(0, marker);
  return staticPart.replace(/\/+$/, "") || "/";
}

function resolveRepoPath(folder) {
  return path.resolve(repoRoot, folder.replace(/^\/+/, ""));
}

function assertFolderExists(folder, label) {
  if (typeof folder !== "string" || folder.trim() === "") {
    fail(`${label} must be a non-empty string`);
  }
  const prefix = staticFolderPrefix(folder);
  const resolved = resolveRepoPath(prefix);
  const relative = path.relative(repoRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`${label} (${folder}) resolves outside the repository`);
  }
  ensureDirectory(resolved, `${label} (${folder})`);
}

function validateConfig() {
  const configPath = path.join(adminDir, "config.yml");
  if (!fs.existsSync(configPath)) {
    fail(`missing admin config: ${configPath} — run npm run cms:config first`);
  }

  let config;
  try {
    config = parseYaml(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    fail(`public/admin/config.yml is not valid YAML: ${error.message}`);
  }
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    fail("public/admin/config.yml must parse to a YAML mapping");
  }
  if (config.backend?.name !== "github" || !config.backend?.repo) {
    fail("config.yml backend must be name: github with a repo");
  }
  if (typeof config.public_folder !== "string" || !config.public_folder.startsWith("/")) {
    fail("config.yml public_folder must be an absolute site path starting with /");
  }
  if (config.output?.omit_empty_optional_fields !== true) {
    fail("config.yml output.omit_empty_optional_fields must be true");
  }
  if (config.output?.yaml?.quote !== "double") {
    fail("config.yml output.yaml.quote must be double");
  }

  assertFolderExists(config.media_folder, "media_folder");

  if (!Array.isArray(config.collections) || config.collections.length === 0) {
    fail("config.yml must define at least one collection");
  }
  for (const collection of config.collections) {
    if (!collection?.name || !collection?.folder) {
      fail(`collection ${JSON.stringify(collection?.name)} is missing a folder`);
    }
    ensureDirectory(
      resolveRepoPath(collection.folder),
      `collection "${collection.name}" folder`
    );
    if (collection.media_folder !== undefined) {
      assertFolderExists(collection.media_folder, `collection "${collection.name}" media_folder`);
    }
    if (
      collection.public_folder !== undefined &&
      (typeof collection.public_folder !== "string" ||
        !collection.public_folder.startsWith("/"))
    ) {
      fail(
        `collection "${collection.name}" public_folder must be an absolute site path starting with /`
      );
    }
  }

  console.log(
    `[cms:sync] config.yml OK: ${config.collections.length} collections, ` +
      `media_folder "${config.media_folder}", public_folder "${config.public_folder}"`
  );
}

async function main() {
  const entry = require.resolve("@sveltia/cms");
  const packageDir = path.dirname(path.dirname(entry)); // <pkg>/npm/index.js -> <pkg>
  const { version } = JSON.parse(
    await fsp.readFile(path.join(packageDir, "package.json"), "utf8")
  );

  await fsp.mkdir(adminDir, { recursive: true });
  await vendorBundle(packageDir, version);
  await copyChunks(path.join(packageDir, "dist"));
  await copyLocales(packageDir);
  await copyAdminTemplates();
  validateConfig();

  console.log(
    `[cms:sync] vendored @sveltia/cms@${version} into ${path.relative(repoRoot, adminDir)} ` +
      "(admin shell + preview included)."
  );
}

await main();
