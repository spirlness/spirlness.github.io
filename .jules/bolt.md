## 2025-09-28 - Avoid Redundant Vector Normalization in Animation Loops
**Learning:** Calling `vector.normalize().multiplyScalar(-k * dist)` when `dist = vector.length()` is mathematically redundant: `(v / dist) * (-k * dist) = v * -k`. Calling `normalize()` inside a 60 FPS frame loop re-computes `Math.sqrt()` and executes 3 floating-point divisions per particle, running ~3.2x slower and introducing minor floating-point precision noise.
**Action:** Simplify spring/gravity acceleration calculations to direct scalar multiplication (`v.multiplyScalar(-k)`), bypassing `normalize()` and `length()` multiplication in animation/physics loops.


## 2026-10-17 - Direct particle matrix writes
**Learning:** For translation plus uniform scale with no rotation or pivot, direct writes match Three.js r184's column-major matrices. Validate active count and capacity before writing. Benchmarks must compare the immediate parent, and isolated update timings do not establish whole-page FPS or allocation behavior.
**Action:** Keep the transform/count contract explicit, use parent-reference matrix and WebGL tests, and report reproducible timing scope without a universal speedup claim.


## 2026-10-23 - Precompute date timestamps before collection sorting
**Learning:** Calling `new Date(item.date).getTime()` inside `Array.prototype.sort()` calls the `Date` constructor $O(N \log N)$ times, creating redundant allocations and potential `NaN` comparison instability in sort order. Pre-mapping items to numeric timestamps once per item ($N$ times total) before sorting reduces Date allocations from $O(N \log N)$ to $O(N)$ and stabilizes sort comparisons against invalid date strings.
**Action:** Use precomputed numeric timestamp properties or Schwartzian decoration when sorting content items by date in data loader modules.
