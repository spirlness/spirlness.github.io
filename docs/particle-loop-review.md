# Particle loop review (PR #68)

The final change uses indexed loops and keeps `Math.hypot`. It preserves the
pre-optimization distance calculation, particle ordering, arithmetic ordering,
fixed-step accumulator, and reduced-motion behavior. The particle array is not
resized during these loops. No claim of zero actual heap allocation is made.

## Regression evidence

`tests/fixtures/particle-reference.ts` freezes the implementation at
`dd63887ed0a7f20a8c73b3f7846322398a05c569`. The state equivalence tests compare
all state and particle fields after every update for 0, 1 and 120 particles,
including substeps, stalls, and invalid deltas. Frame tests execute the actual
component callback with real Three.js matrices and compare all 120 instance
matrices and rotation against the old loop. They also cover reduced motion and
a missing mesh. These are CPU tests with mocked React/R3F scheduling, not GPU
pixel comparisons or browser performance measurements.

## Reproducible CPU benchmark

Run `node scripts/benchmark-particles.mjs` after `npm ci` in a checkout containing
the baseline commit above. No additional dependencies are needed. This executes
the real old/new frame callbacks with Three.js and an instance matrix buffer.
It also separates the original square-root replacement from the loop change.

One local run on Node v24.19.0, AMD EPYC 9V74, 120 particles, 11 batches of 5,000
frames per variant, with 2,000 warm-up frames per batch, gave:

| Variant | Median batch mean, microseconds/frame |
| --- | ---: |
| Baseline | 12.886 |
| Indexed loops, unchanged hypot (final change) | 11.324 |
| Only sqrt replacement | 10.235 |
| Indexed loops + sqrt (original PR) | 7.758 |

The final change saved about 1.56 microseconds (12%) in this CPU harness. The
original combined change was about 1.66x, not 18–19x, in this run. These are
noisy measurements on one host, not guarantees or assertions enforced in CI.
The script emits all samples and p95 of batch means; this is not per-frame p95.
React scheduling, browser work, GPU rendering and heap allocation are not
measured. A browser allocation profile would be required to claim reduced GC
or zero allocation. No user-visible FPS improvement has been established.

## Why retain hypot

The direct square-and-sum formula is not generally equivalent: e.g. components
of 1e200 overflow when squared, components of 1e-200 underflow, and Infinity
combined with NaN has different behavior. Current seeded coordinates are small,
so these are not demonstrated user-facing failures. Retaining hypot keeps the
original numerical contract without needing a bounded-coordinate assumption.

This is a small optional optimization, suitable for merging once CI on the
final commit passes; it is not an urgent rendering bug fix.
