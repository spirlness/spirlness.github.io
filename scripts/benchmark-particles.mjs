import { readFile } from "node:fs/promises";
import { cpus } from "node:os";
import ts from "typescript";

// Load the production functions and frozen reference, not retyped optimized loops.
const root = new URL("../", import.meta.url);
const files = {
  simulation: "src/lib/particle-simulation.ts",
  rendering: "src/lib/particle-rendering.ts",
  reference: "tests/fixtures/particle-reference.ts",
};
const modules = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([name, path]) => {
  const source = await readFile(new URL(path, root), "utf8");
  return [name, ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText];
})));

async function measure(THREE, simulation, rendering, reference, verifyOnly = false, renderer = null) {
  const { createParticles, advanceSimulation } = simulation;
  const { updateParticleMatrices } = rendering;
  const { advanceReference, updateReference } = reference;
  const geometry = new THREE.SphereGeometry(1, 12, 12);
  const material = new THREE.MeshBasicMaterial({ color: "#6366f1" });
  const make = () => {
    const mesh = new THREE.InstancedMesh(geometry, material, 120);
    const scene = new THREE.Scene();
    scene.add(mesh);
    return { particles: createParticles(120), state: { time: 0, accumulator: 0 }, mesh, scene, dummy: new THREE.Object3D() };
  };
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 12;
  const old = make(), current = make();
  const target = renderer ? new THREE.WebGLRenderTarget(256, 256) : null;
  const draw = sample => {
    sample.mesh.rotation.set(0, sample.state.time * 0.12, sample.state.time * 0.06);
    renderer.setRenderTarget(target);
    renderer.render(sample.scene, camera);
  };
  let maxPixelDifference = 0, visiblePixels = 0, maxMatrixDifference = 0;
  const checkpoints = [0, 1, 60, 600, 3600];
  for (let frame = 0; frame <= 3600; frame++) {
    if (frame) {
      advanceSimulation(current.state, current.particles, 1 / 60);
      advanceReference(old.state, old.particles, 1 / 60);
    }
    if (!checkpoints.includes(frame)) continue;
    if (JSON.stringify(current.particles) !== JSON.stringify(old.particles)) throw new Error("Particle trajectories differ");
    updateParticleMatrices(current.mesh, current.dummy, current.particles);
    updateReference(old.mesh, old.dummy, old.particles);
    for (let i = 0; i < current.mesh.instanceMatrix.array.length; i++) {
      maxMatrixDifference = Math.max(maxMatrixDifference, Math.abs(current.mesh.instanceMatrix.array[i] - old.mesh.instanceMatrix.array[i]));
    }
    if (renderer) {
      const a = new Uint8Array(256 * 256 * 4), b = new Uint8Array(a.length);
      draw(old);
      renderer.readRenderTargetPixels(target, 0, 0, 256, 256, a);
      draw(current);
      renderer.readRenderTargetPixels(target, 0, 0, 256, 256, b);
      for (let i = 0; i < a.length; i++) {
        maxPixelDifference = Math.max(maxPixelDifference, Math.abs(a[i] - b[i]));
        if (i % 4 !== 3 && a[i] > 0) visiblePixels++;
      }
    }
  }
  if (maxMatrixDifference !== 0 || maxPixelDifference > 1 || (renderer && !visiblePixels)) throw new Error("Matrix or rendered-pixel regression");
  const result = { checkpoints, maxMatrixDifference, maxPixelDifference: renderer ? maxPixelDifference : null, visiblePixels: renderer ? visiblePixels : null, timings: {} };
  if (!verifyOnly) {
    const cases = {
      physics: [(s) => advanceReference(s.state, s.particles, 1 / 60), (s) => advanceSimulation(s.state, s.particles, 1 / 60)],
      matrices: [(s) => updateReference(s.mesh, s.dummy, s.particles), (s) => updateParticleMatrices(s.mesh, s.dummy, s.particles)],
      frame: [
        s => { advanceReference(s.state, s.particles, 1 / 60); updateReference(s.mesh, s.dummy, s.particles); if (renderer) draw(s); },
        s => { advanceSimulation(s.state, s.particles, 1 / 60); updateParticleMatrices(s.mesh, s.dummy, s.particles); if (renderer) draw(s); },
      ],
    };
    for (const [name, variants] of Object.entries(cases)) {
      const frames = renderer && name === "frame" ? 300 : 10000;
      const samples = [[], []];
      let checksum = 0;
      for (let round = -1; round < 5; round++) {
        for (const index of round % 2 ? [1, 0] : [0, 1]) {
          const sample = make();
          const start = performance.now();
          for (let frame = 0; frame < frames; frame++) variants[index](sample);
          const elapsed = performance.now() - start;
          checksum += sample.particles[0].position.x + sample.mesh.instanceMatrix.array[0];
          if (round >= 0) samples[index].push(elapsed / frames);
          sample.mesh.dispose();
        }
      }
      const summary = values => {
        const sorted = [...values].sort((a, b) => a - b);
        return { medianMsPerFrame: sorted[2], p95BatchMeanMsPerFrame: sorted[4], batchMeansMsPerFrame: values };
      };
      result.timings[name] = { framesPerBatch: frames, baseline: summary(samples[0]), optimized: summary(samples[1]), checksum };
    }
  }
  target?.dispose(); old.mesh.dispose(); current.mesh.dispose(); geometry.dispose(); material.dispose();
  return result;
}

const verifyOnly = process.argv.includes("--verify-only");
if (process.argv.includes("--browser")) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    // Serve only these fixed modules; no external network or dev server is needed.
    const sources = { ...Object.fromEntries(Object.entries(modules).map(([k, v]) => [`/${k}.js`, v])),
      "/three.js": await readFile(new URL("node_modules/three/build/three.module.js", root), "utf8"),
      "/three.core.js": await readFile(new URL("node_modules/three/build/three.core.js", root), "utf8"),
    };
    await page.route("http://particles.test/**", route => {
      const path = new URL(route.request().url()).pathname;
      return route.fulfill({ status: path === "/" || sources[path] ? 200 : 404,
        contentType: path === "/" ? "text/html" : "text/javascript", body: path === "/" ? "<!doctype html><canvas></canvas>" : sources[path] || "" });
    });
    await page.goto("http://particles.test/");
    const result = await page.evaluate(async ({ code, verifyOnly }) => {
      const THREE = await import("/three.js");
      const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas"), antialias: false });
      renderer.setSize(256, 256);
      try {
        const run = new Function(`return (${code})`)();
        return await run(THREE, await import("/simulation.js"), await import("/rendering.js"), await import("/reference.js"), verifyOnly, renderer);
      } finally { renderer.dispose(); }
    }, { code: measure.toString(), verifyOnly });
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(JSON.stringify({ browser: browser.version(), scope: "Isolated production physics + matrices + WebGL submission; not whole-page CPU/FPS or GPU completion time", ...result }, null, 2));
  } finally { await browser.close(); }
} else {
  const load = source => import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
  const [THREE, simulation, rendering, reference] = await Promise.all([import("three"), load(modules.simulation), load(modules.rendering), load(modules.reference)]);
  console.log(JSON.stringify({ node: process.version, cpu: cpus()[0].model, scope: "Physics + actual Three.js matrix updates; no WebGL or browser", ...await measure(THREE, simulation, rendering, reference, verifyOnly) }, null, 2));
}
