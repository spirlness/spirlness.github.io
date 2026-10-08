# Performance measurements

## PR #58 export snapshot

Measured on 2026-10-08 against baseline commit `a60dea9`, using production static exports and Chromium with a fresh browser context for each route. No simulation or dialog was opened. Values are bytes of the requested local assets; gzip values are computed estimates, not observed wire transfer sizes. These results describe loading cost, not a measured improvement in page latency or Core Web Vitals.

| Resource / route | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| CSS, home and publications | 85,957 | 59,597 | 30.7% |
| CSS gzip estimate, home and publications | 15,041 | 10,880 | 27.7% |
| Fonts, home and publications | 117,228 | 68,796 | 41.3% |
| JavaScript, physics article | 495,213 | 479,348 | 3.2% |
| JavaScript gzip estimate, physics article | 149,029 | 143,542 | 3.7% |
| JavaScript, physics project | 507,556 | 491,805 | 3.1% |

In this snapshot, homepage JavaScript was 466,447 bytes. The article still needs formula styles and fonts; its CSS is 83,986 bytes and fonts are 136,832 bytes after the change.

### Changes

- Removed the unused Inter font declaration and preload, saving 48,432 font bytes per measured route. Existing serif and display typography is retained.
- Imported KaTeX CSS at article and project detail pages, so listing pages no longer download it on a fresh load. Client navigation to an article loads its stylesheet. Next.js can retain that stylesheet after subsequent navigation.
- Replaced the SideNote client component with native `details`/`summary`, removing the collapsible package and its hydration work. Narrow layouts support keyboard disclosure even without JavaScript; wide layouts retain the margin note.
- Project metadata reads project fields directly. A metadata/page rendering pair no longer compiles the same MDX body twice. A regression checks that metadata generation never invokes the body compiler.

## Reproduce

Run `npm run build`, then serve that same export with `npm run start -- --listen tcp://127.0.0.1:3000 --no-clipboard --no-port-switching`. In another terminal run `node scripts/measure-assets.mjs`. The script reports requested JavaScript, CSS and WOFF2 sizes and the asset paths for four representative routes.

Browser regressions cover no-JavaScript keyboard disclosure, responsive notes and deferred math styles during client navigation. Existing accessibility and interactive-preview regressions continue to cover those pages.


## Citation loading and compilation cleanup (2026-10-08)

Compared with commit `71312e6`, using the same script and fresh Chromium contexts. The publication list was loaded without opening a dialog.

| Publication-list resource | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Requested JavaScript | 508,215 | 468,170 | 7.9% |
| JavaScript gzip estimate | 153,103 | 140,007 | 8.6% |

The BibTeX trigger loads a separate dialog module on activation. Radix focus management and clipboard feedback remain in that module; closing restores focus to the trigger. A desktop/mobile regression checks that the dialog code is absent from initial requests, loads on activation, and traps/restores keyboard focus. The dependency is deferred, not removed: opening the dialog downloads it. Other measured routes changed by fewer than 100 uncompressed JavaScript bytes; there is no claimed latency or Core Web Vitals improvement.

`SmartLink` no longer declares a client boundary. Server-rendered links can compute safe destinations and external-link descriptions without hydrating that wrapper; the client navbar still imports it, and internal navigation still uses Next Link.

The shared MDX compiler deduplicates matching source/slug/options within a production worker, including concurrent reads. Source changes replace the entry, failures are discarded, and returned headings/references stay isolated. Development bypasses this cache, and separate processes do not share it. Tests check these contracts and ensure both metadata routes avoid body compilation. No build-time speedup percentage was measured.

Deployment now validates content through the coverage suite instead of also running the same integrity test as a separate step. The local quality-check instructions follow that sequence and avoid a separate build before Playwright, which already builds the export. The unused asynchronous `getAllPosts` alias was removed in favor of the frontmatter reader.
