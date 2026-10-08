// Run after `npm run build`, with that export served on port 3000.
// Reports local asset sizes, not observed network compression or page latency.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const origin = "http://127.0.0.1:3000";
const routes = ["/", "/publications/", "/blog/algorithmic-resilience/", "/projects/neural-symbolic-physics/"];
const browser = await chromium.launch();
const results = [];
try {
  for (const route of routes) {
    // A new page gets a fresh context, including a cold browser cache.
    const page = await browser.newPage();
    await page.goto(origin + route);
    await page.waitForLoadState("networkidle");
    const resources = await page.evaluate(() => performance.getEntriesByType("resource").map(entry => entry.name));
    const files = [...new Set(resources.map(name => new URL(name)).filter(url =>
      url.origin === origin && /\.(js|css|woff2)$/.test(url.pathname)
    ).map(url => url.pathname))];
    const assets = files.map(file => ({ file, content: readFileSync(`out${file}`) }));
    const size = (suffix, gzip = false) => assets.filter(asset => asset.file.endsWith(suffix))
      .reduce((sum, asset) => sum + (gzip ? gzipSync(asset.content).length : asset.content.length), 0);
    results.push({ route, js: size(".js"), jsGzip: size(".js", true), css: size(".css"), cssGzip: size(".css", true), fonts: size(".woff2"), files });
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
