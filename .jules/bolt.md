## 2025-09-28 - Avoid Redundant Vector Normalization in Animation Loops
**Learning:** Calling `vector.normalize().multiplyScalar(-k * dist)` when `dist = vector.length()` is mathematically redundant: `(v / dist) * (-k * dist) = v * -k`. Calling `normalize()` inside a 60 FPS frame loop re-computes `Math.sqrt()` and executes 3 floating-point divisions per particle, running ~3.2x slower and introducing minor floating-point precision noise.
**Action:** Simplify spring/gravity acceleration calculations to direct scalar multiplication (`v.multiplyScalar(-k)`), bypassing `normalize()` and `length()` multiplication in animation/physics loops.

## 2025-09-29 - Direct InstancedMesh Matrix Buffer Writes vs. Object3D Dummy Overhead
**Learning:** Using `dummy.position.set()`, `dummy.scale.setScalar()`, `dummy.updateMatrix()`, and `mesh.setMatrixAt()` inside 60/120 FPS animation loops introduces unnecessary TRS matrix composition overhead for simple scale/translation transforms. Direct column-major writes into `mesh.instanceMatrix.array` (Float32Array) achieve ~4x speedup (from ~436ms down to ~108ms per 50k updates) with identical matrix outputs.
**Action:** Write 4x4 matrix elements directly to `instanceMatrix.array` Float32Array buffers for simple particle/instance transforms instead of invoking `Object3D.updateMatrix()`.
