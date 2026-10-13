## 2025-09-28 - Avoid Redundant Vector Normalization in Animation Loops
**Learning:** Calling `vector.normalize().multiplyScalar(-k * dist)` when `dist = vector.length()` is mathematically redundant: `(v / dist) * (-k * dist) = v * -k`. Calling `normalize()` inside a 60 FPS frame loop re-computes `Math.sqrt()` and executes 3 floating-point divisions per particle, running ~3.2x slower and introducing minor floating-point precision noise.
**Action:** Simplify spring/gravity acceleration calculations to direct scalar multiplication (`v.multiplyScalar(-k)`), bypassing `normalize()` and `length()` multiplication in animation/physics loops.

## 2025-10-13 - Avoid Array Iterators and Math.hypot in 60 FPS Animation Loops
**Learning:** Using `array.entries()` or object destructuring in `useFrame` / physics loops allocates iterator objects and key-value tuple arrays on every frame, causing GC pressure in WebGL/Canvas rendering. Additionally, `Math.hypot()` is ~5-10x slower than `Math.sqrt(x*x + y*y + z*z)` due to spec-mandated underflow/overflow bounds handling.
**Action:** Use standard index-based `for` loops (`for (let i = 0; i < arr.length; i++)`) and direct `Math.sqrt()` in 60+ FPS animation loops.
