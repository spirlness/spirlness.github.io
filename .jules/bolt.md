## 2025-09-28 - Avoid Redundant Vector Normalization in Animation Loops
**Learning:** Calling `vector.normalize().multiplyScalar(-k * dist)` when `dist = vector.length()` is mathematically redundant: `(v / dist) * (-k * dist) = v * -k`. Calling `normalize()` inside a 60 FPS frame loop re-computes `Math.sqrt()` and executes 3 floating-point divisions per particle, running ~3.2x slower and introducing minor floating-point precision noise.
**Action:** Simplify spring/gravity acceleration calculations to direct scalar multiplication (`v.multiplyScalar(-k)`), bypassing `normalize()` and `length()` multiplication in animation/physics loops.


## 2026-10-17 - Direct particle matrix writes
**Learning:** For translation plus uniform scale with no rotation or pivot, direct writes match Three.js r184's column-major matrices. Validate active count and capacity before writing. Benchmarks must compare the immediate parent, and isolated update timings do not establish whole-page FPS or allocation behavior.
**Action:** Keep the transform/count contract explicit, use parent-reference matrix and WebGL tests, and report reproducible timing scope without a universal speedup claim.


## 2026-10-18 - Schwartzian Transform on Small Collections
**Learning:** Applying a Schwartzian transform (`.map()` array decorated wrappers) to sort small arrays (e.g. < 100 content items) introduces additional array and object allocation overhead that outweighs the saving of skipping date parsing during sorting. `Date.parse()` directly in the sort comparator avoids `new Date()` object allocations without any intermediate wrapper allocations.
**Action:** For small collection sorting where Date construction overhead is an issue, use `Date.parse()` in the sort comparator rather than allocating intermediate wrapper objects.
