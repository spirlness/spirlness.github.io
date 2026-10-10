## 2025-09-28 - Avoid Redundant Vector Normalization in Animation Loops
**Learning:** Calling `vector.normalize().multiplyScalar(-k * dist)` when `dist = vector.length()` is mathematically redundant: `(v / dist) * (-k * dist) = v * -k`. Calling `normalize()` inside a 60 FPS frame loop re-computes `Math.sqrt()` and executes 3 floating-point divisions per particle, running ~3.2x slower and introducing minor floating-point precision noise.
**Action:** Simplify spring/gravity acceleration calculations to direct scalar multiplication (`v.multiplyScalar(-k)`), bypassing `normalize()` and `length()` multiplication in animation/physics loops.

## 2026-03-30 - Avoid Iterators and Math.hypot in High-Frequency Animation Loops
**Learning:** Using `array.entries()` in 60 FPS animation loops (`useFrame`) creates iterator objects and tuple arrays `[index, element]` on every frame for every particle, causing thousands of garbage-collected object allocations per second. In addition, `Math.hypot(x, y, z)` performs argument checks and scaling logic that make it ~16x slower than direct `Math.sqrt(x*x + y*y + z*z)` for bounded particle coordinates.
**Action:** Use indexed `for` loops (`for (let i = 0; i < len; i++)`) and `Math.sqrt(x*x + y*y + z*z)` in per-frame WebGL/Three.js render loops to eliminate garbage collector pressure and reduce frame calculation time.
