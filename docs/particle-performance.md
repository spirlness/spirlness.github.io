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
npx playwright install chromium webkit
npm run benchmark:particles -- --browser
# Pixel/matrix checks only, without timing:
npm run benchmark:particles -- --browser --verify-only
npm run test:e2e
```

The script transpiles and loads the current production functions and a frozen
matrix reference from the immediate parent of PR #81, `0dbab4f`. No production server or external
assets are needed for the isolated browser comparison. It checks identical GPU
instance matrices at frames 0, 1, 60, 600 and 3600, then compares actual WebGL
render-target pixels with a one-channel-value tolerance and rejects blank output.
The isolated scene uses an unlit material to avoid environment-map dependencies;
the existing page tests cover the actual shaded scene, pause/resume, offscreen
behavior and reduced motion. Pixel comparison is between versions in one browser,
not a hardware-dependent checked-in screenshot.

Both benchmark variants use the current physics function, so matrix and combined
measurements isolate PR #81. Historical physics equivalence remains covered by
the unit tests against `dd63887`.

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


## Direct buffer contract (PR #81)

`updateParticleMatrices(mesh, particles)` applies translation and positive uniform
scale only; it accepts no dummy rotation or pivot. Particles must match `mesh.count`
and fit `instanceMatrix.count` and the backing array. Mismatches throw before any
buffer mutation; callers reducing particle counts must also reduce the active mesh
count. Zero active particles and spare inactive capacity are supported.

Three.js is locked to 0.184.0. Its `setMatrixAt` copies 16 column-major elements into
the same Float32Array. Direct writes preserve that layout and mark `needsUpdate`
once after the loop. Neither approach automatically refreshes cached bounds.

CI also runs the actual page's start/pause/resume, offscreen/hidden handling and
reduced-motion tests under mobile WebKit emulation. This is not an iPhone hardware
measurement. The original 50,000-update / 4x claim has no committed reproducible
benchmark and is withdrawn; `Object3D.updateMatrix()` composes, rather than
decomposes, an existing matrix, and allocation claims require separate profiling.


## Local parent comparison (2026-10-17)

Node 24.19.0, AMD EPYC 9V74, 120 particles, 10,000 frames per batch,
one warm-up batch and five measured batches (median of batch mean times):

| Scope | Parent 0dbab4f ms/frame | Direct buffer ms/frame |
| --- | ---: | ---: |
| Matrix updates | 0.003758 | 0.000845 |
| Physics + matrix updates | 0.007230 | 0.004198 |

All matrix checkpoints matched exactly. The matrix portion was about 4.45x faster
in this Node run, but the absolute saving was only about 0.0029 ms per 120-particle
update. This does not establish a whole-page FPS improvement or mobile GPU result.
