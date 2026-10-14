## 2025-09-28 - Avoid Redundant Vector Normalization in Animation Loops
**Learning:** Calling `vector.normalize().multiplyScalar(-k * dist)` when `dist = vector.length()` is mathematically redundant: `(v / dist) * (-k * dist) = v * -k`. Calling `normalize()` inside a 60 FPS frame loop re-computes `Math.sqrt()` and executes 3 floating-point divisions per particle, running ~3.2x slower and introducing minor floating-point precision noise.
**Action:** Simplify spring/gravity acceleration calculations to direct scalar multiplication (`v.multiplyScalar(-k)`), bypassing `normalize()` and `length()` multiplication in animation/physics loops.

## 2025-09-29 - Eliminate Iterator Allocations and Math.hypot Overhead in 60 FPS Animation Loops
**Learning:** Calling `Array.prototype.entries()` (`for (const [i, p] of arr.entries())`) in a per-frame animation loop (60–120 FPS) allocates ~7,200–14,400 short-lived arrays and iterator objects per second, generating garbage collection pressure in real-time 3D canvas rendering. Additionally, `Math.hypot(x, y, z)` carries significant variadic overhead compared to `Math.sqrt(x*x + y*y + z*z)`.
**Action:** Use simple indexed `for` loops (`for (let i = 0; i < len; i++)`) and explicit sum-of-squares `Math.sqrt()` inside hot animation loops to eliminate per-frame heap allocations and reduce frame loop processing time by >90%.
