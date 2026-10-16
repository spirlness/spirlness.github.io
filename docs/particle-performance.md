# Particle-loop optimization

The indexed physics loop preserves the original particle order and arithmetic.
The render loop uses an explicit sum of squares for the demo's finite, damped
coordinates. This is not a general replacement for `Math.hypot`: extreme values
can overflow/underflow and mixed Infinity/NaN inputs have different semantics.
The existing minimum scale also clamps very large distances.

## Reproduce

```sh
npm ci
npm run test -- src/lib/__tests__/particle-optimization.test.ts
npm run benchmark:particles
npx playwright install chromium
npm run benchmark:particles -- --browser
# Pixel/matrix checks only, without timing:
npm run benchmark:particles -- --browser --verify-only
npm run test:e2e
```

The script transpiles and loads the current production functions and a frozen
pre-optimization reference from commit `dd63887`. No production server or external
assets are needed for the isolated browser comparison. It checks identical GPU
instance matrices at frames 0, 1, 60, 600 and 3600, then compares actual WebGL
render-target pixels with a one-channel-value tolerance and rejects blank output.
The isolated scene uses an unlit material to avoid environment-map dependencies;
the existing page tests cover the actual shaded scene, pause/resume, offscreen
behavior and reduced motion. Pixel comparison is between versions in one browser,
not a hardware-dependent checked-in screenshot.

The benchmark uses 120 particles, one warm-up batch and five measured batches,
alternating baseline/optimized execution order with fresh state for each batch.
It reports physics, matrix updates, and their combination separately. Browser
combined-frame measurements include WebGL submission; they do not wait for GPU
completion and do not measure React, whole-page CPU, FPS, GC or allocation counts.
Checksums consume the results. P95 is explicitly the P95 of **batch mean frame
times**, not the P95 of individual animation frames. Timings are informational,
not CI pass/fail thresholds. Run on target devices before making user-facing
performance claims.

## Local observation (2026-10-16)

Node 24.19.0, Intel Xeon Platinum 8573C, 10,000 frames per batch:

| Scope | Baseline median ms/frame | Optimized median ms/frame |
| --- | ---: | ---: |
| Physics | 0.00704 | 0.00568 |
| Three.js instance matrices | 0.01424 | 0.00669 |
| Physics + instance matrices | 0.02244 | 0.01140 |

The combined CPU work in this run was about 49% lower. These measurements include
the actual matrix operations, unlike a distance-only microbenchmark. They do not
support a claim of 95% lower whole-animation CPU usage or zero allocations.
Browser results and all raw batch measurements are printed by the script and CI.
