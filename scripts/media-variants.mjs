#!/usr/bin/env node
/**
 * Generate responsive WebP variants for the static-export media pipeline.
 *
 * For every jpg/jpeg/png/webp file under the scanned directories, writes
 * `<base>-640.webp`, `<base>-1280.webp` and `<base>-1920.webp` next to the
 * source at quality 80. Widths are capped at the source width (no upscaling),
 * so a 900px source yields `-640.webp` and a 900px-wide `-1280.webp`/`-1920.webp`.
 *
 * Output is deterministic (fixed encoder settings, metadata stripped, atomic
 * temp-file rename) and idempotent (an existing variant newer than its source
 * is left untouched; re-running produces no rewrite).
 *
 * Usage:
 *   node scripts/media-variants.mjs                 # one-shot, default dirs
 *   node scripts/media-variants.mjs --watch         # watch fanned-out dirs
 *   node scripts/media-variants.mjs dir1 dir2       # one-shot, given dirs
 *   node scripts/media-variants.mjs --watch dir1    # watch given dirs
 *
 * Only raster sources with .jpg/.jpeg/.png/.webp extensions are read; svg,
 * avif, hdr, gif and anything else are skipped, as are already-generated
 * `-<width>.webp` variants (so a scan never emits variants of variants).
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const WIDTHS = [640, 1280, 1920];
const QUALITY = 80;
const SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
/** Generated variants end with a configured width; never treat them as sources. */
const VARIANT_NAME = /-(640|1280|1920)\.webp$/i;
const DEFAULT_DIRS = ["public/posts", "public/projects"];
const WATCH_DEBOUNCE_MS = 200;
const WATCH_POLL_MS = 2000;

function usage() {
  return [
    "Usage: node scripts/media-variants.mjs [--watch] [--force] [dirs...]",
    "",
    `Default directories: ${DEFAULT_DIRS.join(", ")}`,
    `Variants: ${WIDTHS.map((w) => `-${w}.webp`).join(", ")} at quality ${QUALITY}`,
  ].join("\n");
}

function parseArgs(argv) {
  const options = { watch: false, force: false, dirs: [], help: false };
  for (const arg of argv) {
    if (arg === "--watch" || arg === "-w") options.watch = true;
    else if (arg === "--force" || arg === "-f") options.force = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    else options.dirs.push(arg);
  }
  if (options.dirs.length === 0) options.dirs = [...DEFAULT_DIRS];
  return options;
}

/** Recursively collect raster sources; missing directories are reported by the caller. */
async function listSources(directory) {
  const sources = [];
  const entries = await fsp.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      sources.push(...(await listSources(entryPath)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (VARIANT_NAME.test(entry.name)) continue;
    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    sources.push(entryPath);
  }
  return sources.sort((a, b) => a.localeCompare(b));
}

async function isUpToDate(sourcePath, outputPath) {
  const [sourceStat, outputStat] = await Promise.all([
    fsp.stat(sourcePath),
    fsp.stat(outputPath).catch(() => null),
  ]);
  return Boolean(
    outputStat &&
      outputStat.isFile() &&
      outputStat.size > 0 &&
      outputStat.mtimeMs >= sourceStat.mtimeMs
  );
}

/**
 * Write one variant atomically (temp file in the same directory, then rename)
 * so a crash can never leave a half-written variant that the mtime check would
 * later accept.
 */
async function writeVariant(sourcePath, width, outputPath) {
  const tempPath = `${outputPath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    const info = await sharp(sourcePath, { failOn: "error" })
      .rotate() // honour EXIF orientation before measuring/capping width
      .resize({ width, withoutEnlargement: true }) // width-capped, never upscale
      .webp({ quality: QUALITY })
      .toFile(tempPath);
    await fsp.rename(tempPath, outputPath);
    return { width: info.width, height: info.height, size: info.size };
  } finally {
    await fsp.rm(tempPath, { force: true });
  }
}

async function processSource(sourcePath, { force }) {
  const parsed = path.parse(sourcePath);
  const results = [];
  for (const width of WIDTHS) {
    const outputPath = path.join(parsed.dir, `${parsed.name}-${width}.webp`);
    if (!force && (await isUpToDate(sourcePath, outputPath))) {
      results.push({ outputPath, status: "unchanged" });
      continue;
    }
    const info = await writeVariant(sourcePath, width, outputPath);
    results.push({ outputPath, status: "written", ...info });
  }
  return results;
}

async function scan(dirs, { force, log, quietWhenIdle = false }) {
  let sources = 0;
  let written = 0;
  let unchanged = 0;
  let failed = 0;

  for (const dir of dirs) {
    let exists = true;
    try {
      const stat = await fsp.stat(dir);
      exists = stat.isDirectory();
    } catch {
      exists = false;
    }
    if (!exists) {
      log(`skip (not a directory): ${dir}`);
      continue;
    }
    const paths = await listSources(dir);
    const owners = new Map();
    for (const source of paths) {
      const { dir: parent, name } = path.parse(source);
      const stem = path.join(parent, name).toLowerCase();
      const owner = owners.get(stem);
      if (owner) throw new Error(`Variant filename collision: ${owner} and ${source}. Rename one source.`);
      owners.set(stem, source);
    }
    for (const sourcePath of paths) {
      sources += 1;
      try {
        const results = await processSource(sourcePath, { force });
        for (const result of results) {
          if (result.status === "unchanged") {
            unchanged += 1;
          } else {
            written += 1;
            log(
              `wrote ${result.outputPath} (${result.width}x${result.height}, ${result.size} bytes)`
            );
          }
        }
      } catch (error) {
        failed += 1;
        log(`error ${sourcePath}: ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  // Watch-mode polling scans run every couple of seconds; only report them
  // when they did work or hit an error, so an idle watcher stays quiet.
  if (!quietWhenIdle || written > 0 || failed > 0) {
    log(
      `scan complete: ${sources} source(s), ${written} variant(s) written, ` +
        `${unchanged} up to date${failed ? `, ${failed} failed` : ""}`
    );
  }
  return { sources, written, unchanged, failed };
}

function debounce(callback, delay) {
  let timer = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      callback();
    }, delay);
  };
}

async function watch(dirs, options) {
  const log = (message) => console.log(`[media-variants] ${message}`);

  // Serialise scans so overlapping filesystem events cannot interleave writes.
  let running = null;
  let queued = false;
  let queuedAnnounce = false;
  const runScan = (announce = false) => {
    if (running) {
      queued = true;
      queuedAnnounce = queuedAnnounce || announce;
      return running;
    }
    running = (async () => {
      try {
        await scan(dirs, { ...options, log, quietWhenIdle: !announce });
      } catch (error) {
        log(`scan failed: ${error instanceof Error ? error.message : error}`);
      } finally {
        running = null;
        if (queued) {
          const nextAnnounce = queuedAnnounce;
          queued = false;
          queuedAnnounce = false;
          void runScan(nextAnnounce);
        }
      }
    })();
    return running;
  };

  const scheduleScan = debounce(() => void runScan(), WATCH_DEBOUNCE_MS);

  const watchers = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      log(`watch: ${dir} does not exist yet; polling covers its creation`);
      continue;
    }
    try {
      // Recursive watch works on Windows/macOS; Linux falls back to polling below.
      const watcher = fs.watch(dir, { recursive: true }, scheduleScan);
      watcher.on("error", (error) => {
        log(`watch error on ${dir}: ${error.message}`);
      });
      watchers.push(watcher);
    } catch (error) {
      log(
        `recursive watch unavailable for ${dir} (${error instanceof Error ? error.message : error}); using polling`
      );
    }
  }

  // Always keep a low-frequency poll as the portable safety net (and the only
  // mechanism for directories that do not exist at startup).
  const poller = setInterval(() => void runScan(), WATCH_POLL_MS);

  const shutdown = () => {
    for (const watcher of watchers) watcher.close();
    clearInterval(poller);
    void (async () => {
      if (running) await running;
      process.exit(0);
    })();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  if (process.platform === "win32") process.on("SIGBREAK", shutdown);

  log(`watching ${dirs.join(", ")} (Ctrl-C to stop)`);
  await runScan(true);
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error(usage());
    process.exitCode = 2;
    return;
  }
  if (options.help) {
    console.log(usage());
    return;
  }

  if (options.watch) {
    await watch(options.dirs, options);
    return;
  }

  const result = await scan(options.dirs, {
    force: options.force,
    log: (message) => console.log(`[media-variants] ${message}`),
  });
  if (result.failed > 0) process.exitCode = 1;
}

await main();
