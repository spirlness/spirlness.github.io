#!/usr/bin/env node
/**
 * PostToolUse (Edit|Write) dispatcher — wired from .claude/settings.json.
 *
 * Gives immediate feedback on the two deploy gates instead of waiting for
 * `npm run lint` / `npm test` / CI:
 *   1. src/** and root config .ts/.tsx/.js/.mjs -> eslint --fix; exit 2 with
 *      whatever problems --fix could not repair.
 *   2. src/lib/<name>.ts                        -> run __tests__/<name>.test.ts if it exists.
 *   3. content/**                               -> run the content-integrity suite (npm run content:check).
 *
 * Exit 0 is silent success; exit 2 feeds stderr back to Claude. Invoke the
 * local eslint/vitest bins via process.execPath (no shell, no npx) so the
 * same script works on Windows and POSIX.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const MAX_TAIL_LINES = 40;

function tail(text) {
  const lines = String(text || "").trim().split("\n");
  return lines.slice(-MAX_TAIL_LINES).join("\n");
}

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

let payload;
try {
  payload = JSON.parse(readStdin() || "{}");
} catch {
  process.exit(0); // never break the harness on malformed input
}

const filePath = payload?.tool_input?.file_path;
if (typeof filePath !== "string" || filePath === "") process.exit(0);

const cwd = process.cwd();
const rel = path.relative(cwd, filePath).split(path.sep).join("/");
if (rel.startsWith("..")) process.exit(0); // outside this repo
if (!fs.existsSync(filePath)) process.exit(0); // deleted by the edit

const isLintable =
  /\.(ts|tsx|js|mjs)$/.test(rel) && !rel.startsWith(".claude/");
const isLibSource = /^src\/lib\/[^/]+\.ts$/.test(rel);
const isContent = rel.startsWith("content/");

if (!isLintable && !isLibSource && !isContent) process.exit(0);

const nodeBin = process.execPath;
const eslintBin = path.join(cwd, "node_modules", "eslint", "bin", "eslint.js");
const vitestBin = path.join(cwd, "node_modules", "vitest", "vitest.mjs");

const problems = [];

if (isLintable && fs.existsSync(eslintBin)) {
  // --max-warnings 0: this repo holds itself to zero warnings, so anything
  // left after --fix (error or warning) is fed back for an immediate fix.
  const r = spawnSync(
    nodeBin,
    [eslintBin, "--fix", "--max-warnings", "0", filePath],
    { encoding: "utf8" }
  );
  if (r.status !== 0) {
    problems.push(
      `[on-edit] eslint still reports problems in ${rel} (auto-fix applied what it could):\n${tail(r.stdout || r.stderr)}`
    );
  }
}

if (isLibSource) {
  const name = path.basename(rel, ".ts");
  const testFile = path.join(cwd, "src", "lib", "__tests__", `${name}.test.ts`);
  if (fs.existsSync(testFile) && fs.existsSync(vitestBin)) {
    const r = spawnSync(nodeBin, [vitestBin, "run", testFile], { encoding: "utf8" });
    if (r.status !== 0) {
      problems.push(`[on-edit] vitest failed for ${name}.test.ts:\n${tail(r.stdout + r.stderr)}`);
    }
  }
}

if (isContent && fs.existsSync(vitestBin)) {
  const r = spawnSync(
    nodeBin,
    [vitestBin, "run", "src/lib/__tests__/content-integrity.test.ts"],
    { encoding: "utf8" }
  );
  if (r.status !== 0) {
    problems.push(
      `[on-edit] content check failed (slug/tag/id rules — see CLAUDE.md "Content architecture"):\n${tail(r.stdout + r.stderr)}`
    );
  }
}

if (problems.length > 0) {
  console.error(problems.join("\n\n"));
  process.exit(2);
}
process.exit(0);
