#!/usr/bin/env node
/**
 * One command for local CMS authoring.
 *
 *   npm run cms            # port 3000
 *   npm run cms -- --port 3100
 *
 * Pipeline:
 *   1. generate public/admin/config.yml from the zod schemas (tsx)
 *   2. vendor the Sveltia bundle + admin shell into public/admin
 *   3. start the sharp media watcher (public/posts, public/projects)
 *   4. start the fast content validator (content/)
 *   5. start `next dev`
 *
 * Ctrl-C stops all children (on Windows the whole process tree is killed with
 * `taskkill /T /F`). The CMS itself is at /admin/index.html on the dev-server port.
 */
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
const nextCli = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");
const DEFAULT_PORT = 3000;

function usage() {
  return [
    "Usage: node scripts/cms.mjs [--port <number>]",
    "",
    `  --port, -p   dev-server port (default ${DEFAULT_PORT})`,
    "  --help, -h   show this help",
  ].join("\n");
}

function parseArgs(argv) {
  let port = DEFAULT_PORT;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") return { help: true, port };
    if (arg === "--port" || arg === "-p") {
      port = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg.startsWith("--port=")) {
      port = Number(arg.slice("--port=".length));
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${port}`);
  }
  return { help: false, port };
}

function runStep(executable, args, label) {
  console.log(`[cms] ${label}...`);
  const result = spawnSync(executable, args, { cwd: repoRoot, stdio: "inherit" });
  if (result.error) {
    console.error(`[cms] ${label} failed: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[cms] ${label} failed (exit ${result.status ?? "unknown"}).`);
    process.exit(result.status ?? 1);
  }
}

const children = new Map();
let shuttingDown = false;

function prefixStream(stream, name) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    let newline;
    while ((newline = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newline).replace(/\r$/, "");
      buffer = buffer.slice(newline + 1);
      console.log(`[${name}] ${line}`);
    }
  });
  stream.on("end", () => {
    if (buffer.trim()) console.log(`[${name}] ${buffer}`);
    buffer = "";
  });
}

function startChild(name, args) {
  const child = spawn(process.execPath, args, {
    cwd: repoRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    // A dedicated process group lets POSIX shutdown signal the whole tree.
    detached: process.platform !== "win32",
  });
  prefixStream(child.stdout, name);
  prefixStream(child.stderr, name);
  child.on("error", (error) => {
    console.error(`[${name}] failed to start: ${error.message}`);
  });
  child.on("exit", (code, signal) => {
    children.delete(name);
    if (shuttingDown) return;
    console.log(`[${name}] exited (${signal ?? code ?? "unknown"}).`);
    if (name === "next") {
      shutdown(code ?? 1);
    }
  });
  children.set(name, child);
  return child;
}

function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    try {
      child.kill("SIGTERM");
    } catch {
      // Process already gone.
    }
  }
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("[cms] shutting down (dev server, media watcher, validator)...");
  for (const child of children.values()) killTree(child);
  if (process.platform !== "win32") {
    // Escalate for children that ignored SIGTERM, before the process exits.
    setTimeout(() => {
      for (const child of children.values()) {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          // Already gone.
        }
      }
    }, 500).unref();
  }
  // Give the process tree a moment to die, then leave.
  setTimeout(() => process.exit(code), 800).unref();
}

// Last-resort cleanup for any exit path that did not go through shutdown().
process.on("exit", () => {
  for (const child of children.values()) killTree(child);
});

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[cms] ${error.message}`);
    console.error(usage());
    process.exit(2);
  }
  if (options.help) {
    console.log(usage());
    return;
  }

  runStep(
    process.execPath,
    [tsxCli, "scripts/generate-sveltia-config.mjs"],
    "generating public/admin/config.yml from zod schemas"
  );
  runStep(
    process.execPath,
    ["scripts/sync-sveltia-admin.mjs"],
    "vendoring the Sveltia admin into public/admin"
  );

  const port = String(options.port);
  startChild("media", ["scripts/media-variants.mjs", "--watch"]);
  startChild("validate", [tsxCli, "scripts/validate-content-fast.mjs", "--watch"]);
  startChild("next", [nextCli, "dev", "--port", port]);

  console.log("");
  console.log(`[cms] CMS:       http://localhost:${port}/admin/index.html`);
  console.log(`[cms] site:      http://localhost:${port}/`);
  console.log("[cms] Ctrl-C stops the dev server, media watcher and validator.");
  console.log("");

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));
  process.on("SIGHUP", () => shutdown(0));
  if (process.platform === "win32") {
    process.on("SIGBREAK", () => shutdown(0));
  }
}

main();
