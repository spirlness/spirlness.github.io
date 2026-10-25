## 2025-09-28 - Avoid Redundant Vector Normalization in Animation Loops
**Learning:** Calling `vector.normalize().multiplyScalar(-k * dist)` when `dist = vector.length()` is mathematically redundant: `(v / dist) * (-k * dist) = v * -k`. Calling `normalize()` inside a 60 FPS frame loop re-computes `Math.sqrt()` and executes 3 floating-point divisions per particle, running ~3.2x slower and introducing minor floating-point precision noise.
**Action:** Simplify spring/gravity acceleration calculations to direct scalar multiplication (`v.multiplyScalar(-k)`), bypassing `normalize()` and `length()` multiplication in animation/physics loops.


## 2026-10-17 - Direct particle matrix writes
**Learning:** For translation plus uniform scale with no rotation or pivot, direct writes match Three.js r184's column-major matrices. Validate active count and capacity before writing. Benchmarks must compare the immediate parent, and isolated update timings do not establish whole-page FPS or allocation behavior.
**Action:** Keep the transform/count contract explicit, use parent-reference matrix and WebGL tests, and report reproducible timing scope without a universal speedup claim.


## 2026-10-25 - Preserve valid timestamps when sorting projects
**Learning:** Project months are validated before sorting. The Unix epoch has timestamp zero and must not be treated as missing with `||`. `Date.parse` avoids explicit Date construction, but the performance tradeoff against precomputation depends on data size and caching.
**Action:** Keep the small project collection comparator simple, retain zero/negative timestamps, and test epoch ordering, ties, schema rejection and cached reads. Do not claim a universal small-array performance threshold without measurements.
