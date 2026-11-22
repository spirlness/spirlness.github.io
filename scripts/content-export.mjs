import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { parse } from "parse5";
import { siteProfile } from "../src/content/site.ts";
import { parsePostFrontmatter, parseProject } from "../src/lib/content-schemas.ts";
import { readContentFile } from "../src/lib/content-files.ts";
import { EMPTY_STATIC_PARAM } from "../src/lib/content-id.ts";
import { parseSrcSet } from "../src/lib/media-srcset.ts";

const outDir = path.resolve("out");
const clean = process.argv.includes("--clean");
const pages = new Set(["/", "/blog/", "/projects/", "/publications/"]);
const draftFolders = [];
const siteOrigin = new URL(siteProfile.url).origin;

for (const [collection, extension] of [["posts", ".mdx"], ["projects", ".json"]]) {
  const dir = path.join("content", collection);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(extension))) {
    const id = path.basename(file, extension);
    const raw = readContentFile(dir, file);
    const post = collection === "posts";
    const entry = post ? parsePostFrontmatter(matter(raw).data, id) : parseProject(JSON.parse(raw), id);
    const route = `/${post ? "blog" : "projects"}/${id}/`;
    if (entry.draft) {
      if (fs.existsSync(path.join(outDir, route, "index.html"))) {
        throw new Error(`Draft page found in export: ${route}`);
      }
      draftFolders.push(path.join(outDir, collection, id));
    } else {
      pages.add(route);
      if (post) {
        for (const tag of entry.tags) pages.add(`/blog/tag/${tag}/`);
      }
    }
  }
}

// Read only public pages. A draft upload retained by a published page is shared;
// a reference inside another draft or a file copied from public/ cannot retain it.
const shared = new Set();
function collectReferences(node, base) {
  for (const { name, value } of node.attrs ?? []) {
    let urls;
    if (name === "srcset" || name === "imagesrcset") urls = parseSrcSet(value) ?? [];
    else if (["href", "src", "poster", "data"].includes(name)) urls = [value];
    else continue;
    for (const candidate of urls) {
      if (!URL.canParse(candidate, base)) continue;
      const url = new URL(candidate, base);
      if (url.origin !== siteOrigin) continue;
      try {
        shared.add(decodeURIComponent(url.pathname));
      } catch {
        // A literal percent sign in a filename need not be a URL escape.
        shared.add(url.pathname);
      }
    }
  }
  for (const child of node.childNodes ?? []) collectReferences(child, base);
}

for (const route of pages) {
  const file = path.join(outDir, route, "index.html");
  if (!fs.statSync(file, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`Missing exported page: ${route}`);
  }
  if (draftFolders.length) {
    collectReferences(parse(fs.readFileSync(file, "utf8")), new URL(route, siteOrigin));
  }
}

function checkFolder(dir, keep, description) {
  const relative = path.relative(fs.realpathSync(outDir), fs.realpathSync(dir));
  if (!relative || relative.startsWith(".." + path.sep) || relative === ".." || path.isAbsolute(relative)) {
    throw new Error(`Unexpected export directory: ${dir}`);
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      checkFolder(target, keep, description);
    } else {
      const url = "/" + path.relative(outDir, target).split(path.sep).join("/");
      if (keep(url)) continue;
      if (!clean) throw new Error(`${description} found in export: ${url}`);
      fs.unlinkSync(target);
    }
  }
  if (clean && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}

for (const dir of draftFolders) {
  if (fs.existsSync(dir)) checkFolder(dir, (url) => shared.has(url), "Draft attachment");
}
// Next writes HTML and RSC files even when the placeholder calls notFound().
for (const prefix of ["blog", "blog/tag", "projects"]) {
  const dir = path.join(outDir, prefix, EMPTY_STATIC_PARAM);
  if (fs.existsSync(dir)) {
    checkFolder(dir, (url) => fs.existsSync(path.join("public", url)), "Empty route placeholder");
  }
}
console.log(`[export] Verified ${pages.size} public pages and ${draftFolders.length} draft entries.`);
