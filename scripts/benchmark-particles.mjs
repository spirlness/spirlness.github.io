// CPU frame microbenchmark, not a browser/GPU or allocation measurement.
// Run: node scripts/benchmark-particles.mjs (requires the baseline commits in git).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const BASE = 'dd63887ed0a7f20a8c73b3f7846322398a05c569';
const SIM = 'src/lib/particle-simulation.ts';
const VIEW = 'src/components/interactive/PhysicsDemo.tsx';
const fromGit = path => execFileSync('git', ['show', `${BASE}:${path}`], { cwd: root, encoding: 'utf8' });
const baseSim = fromGit(SIM);
const baseView = fromGit(VIEW);
const currentSim = readFileSync(new URL(SIM, root), 'utf8');
const currentView = readFileSync(new URL(VIEW, root), 'utf8');
const sqrtView = baseView.replace('Math.hypot(position.x, position.y, position.z)',
  'Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z)');

function load(source, fileName, overrides = {}) {
  const { outputText } = ts.transpileModule(source, {
    fileName,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(
    name => Object.hasOwn(overrides, name) ? overrides[name] : require(name), mod, mod.exports);
  return mod.exports;
}

function frameFor(sim, view) {
  let frame;
  const matrices = new Float32Array(120 * 16);
  const mesh = { rotation: { y: 0, z: 0 }, instanceMatrix: { needsUpdate: false },
    setMatrixAt: (i, matrix) => matrix.toArray(matrices, i * 16) };
  const component = load(view, VIEW, {
    react: { useMemo: factory => factory(), useRef: value => ({ current: value === null ? mesh : value }) },
    '@react-three/fiber': { useFrame: fn => { frame = fn; } },
    '@/lib/particle-simulation': load(sim, SIM),
    './usePrefersReducedMotion': { usePrefersReducedMotion: () => false },
  });
  component.default();
  return { frame, checksum: () => mesh.rotation.y + matrices[0] + matrices[12] };
}

const variants = [
  ['baseline', baseSim, baseView],
  ['indexed-only (current)', currentSim, currentView],
  ['sqrt-only', baseSim, sqrtView],
  ['indexed+sqrt (original PR)', currentSim, currentView.replace('Math.hypot(pos.x, pos.y, pos.z)',
    'Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z)')],
];
const samples = variants.map(() => []);
let checksum = 0;
const frames = 5000;
for (let round = 0; round < 11; round++) {
  const order = variants.map((_, i) => i);
  if (round % 2) order.reverse();
  for (const index of order) {
    const [, sim, view] = variants[index];
    const { frame, checksum: consume } = frameFor(sim, view);
    for (let i = 0; i < 2000; i++) frame(null, 1 / 60);
    const start = performance.now();
    for (let i = 0; i < frames; i++) frame(null, 1 / 60);
    samples[index].push((performance.now() - start) / frames);
    checksum += consume();
  }
}
console.log(JSON.stringify({ node: process.version, cpu: cpus()[0]?.model,
  particles: 120, framesPerSample: frames, samples: 11, warmupFrames: 2000,
  scope: 'Real useFrame callback CPU work with Three.js matrices and a mesh buffer; no React scheduler, browser, GPU or allocation profiling',
  results: samples.map((values, i) => {
    values.sort((a, b) => a - b);
    return { variant: variants[i][0], medianMs: values[5], p95BatchMeanMs: values[10], samplesMs: values };
  }), checksum }, null, 2));
