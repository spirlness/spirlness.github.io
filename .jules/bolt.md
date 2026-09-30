## 2025-09-28 - Avoid Redundant Vector Normalization in Animation Loops
**Learning:** Calling `vector.normalize().multiplyScalar(-k * dist)` when `dist = vector.length()` is mathematically redundant: `(v / dist) * (-k * dist) = v * -k`. Calling `normalize()` inside a 60 FPS frame loop re-computes `Math.sqrt()` and executes 3 floating-point divisions per particle, running ~3.2x slower and introducing minor floating-point precision noise.
**Action:** Simplify spring/gravity acceleration calculations to direct scalar multiplication (`v.multiplyScalar(-k)`), bypassing `normalize()` and `length()` multiplication in animation/physics loops.

## 2026-03-31 - Memoize Static Content File Parsing across AST Plugin Invocations
**Learning:** In MDX compilation pipelines (such as `compileMDX`), remark/rehype plugins like `citationPlugin` execute per-post compilation and invoke helpers like `getAllPublications()`. Without module-scoped memoization, every post compilation synchronously re-reads static content files (`content/references.bib`) from disk and re-runs heavy syntax parsers (`@retorquere/bibtex-parser`).
**Action:** Memoize static data loader functions at module scope in Next.js SSG build flows to convert repeated N-time disk reads and heavy parsing into a single operation.
