#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function findSveltiaAsset(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (/sveltia/i.test(entry.name)) return target;
    if (entry.isDirectory()) {
      const match = findSveltiaAsset(target);
      if (match) return match;
    }
  }
}

/** The build may remove the generated admin. Verification only reads the export. */
export function checkCmsExport(outDir, { clean = false } = {}) {
  if (!fs.lstatSync(outDir, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error("out/ must be a directory. Run npm run build first.");
  }

  const adminDir = path.join(outDir, "admin");
  const admin = fs.lstatSync(adminDir, { throwIfNoEntry: false });
  if (admin) {
    if (!clean) throw new Error("CMS admin found in export: out/admin");
    fs.rmSync(adminDir, { recursive: admin.isDirectory(), force: true });
  }

  const stray = findSveltiaAsset(outDir);
  if (stray) {
    throw new Error(`Sveltia asset found in export: ${path.relative(outDir, stray)}`);
  }
}

const script = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === script) {
  checkCmsExport(path.resolve(path.dirname(script), "../out"), { clean: true });
  console.log("[cms:strip] CMS admin is absent from out/.");
}
