import { Vector4, vector } from './vector4';

// PCG-hash based per-pixel RNG, kept bit-identical with rng.wgsl.
//
// Usage:
//   const s = new Uint32Array(1);
//   reseed(s, x, y, pass, 0);
//   const u = nextFloat01(s);
//
// The stream is keyed on (x, y, pass, dim) so each sampling dimension
// (pixel jitter, hemisphere bounce, future path-tracer dims) can draw
// decorrelated values across passes.

export function pcgHash(input: number): number {
  const state = (Math.imul(input | 0, 747796405) + 2891336453) >>> 0;
  const shift = ((state >>> 28) + 4) & 31;
  const xored = ((state >>> shift) ^ state) >>> 0;
  const word = Math.imul(xored | 0, 277803737) >>> 0;
  return ((word >>> 22) ^ word) >>> 0;
}

export function reseed(
  state: Uint32Array,
  x: number,
  y: number,
  pass: number,
  dim: number
): void {
  let s = pcgHash(x >>> 0);
  s = pcgHash((s ^ (y >>> 0)) >>> 0);
  s = pcgHash((s ^ (pass >>> 0)) >>> 0);
  s = pcgHash((s ^ (dim >>> 0)) >>> 0);
  state[0] = s;
}

export function nextU32(state: Uint32Array): number {
  state[0] = pcgHash(state[0]);
  return state[0];
}

const INV_U32 = 1 / 4294967296;

export function nextFloat01(state: Uint32Array): number {
  return nextU32(state) * INV_U32;
}

// Duff et al. 2017, "Building an Orthonormal Basis, Revisited".
// Branch-avoiding — the sign handles the z < 0 hemisphere.
function orthonormalBasis(n: Vector4): [Vector4, Vector4] {
  const sign = n.z >= 0 ? 1 : -1;
  const a = -1 / (sign + n.z);
  const b = n.x * n.y * a;
  const tangent = vector(
    1 + sign * n.x * n.x * a,
    sign * b,
    -sign * n.x
  );
  const bitangent = vector(b, sign + n.y * n.y * a, -n.y);
  return [tangent, bitangent];
}

export function sampleHemisphereCosine(
  u1: number,
  u2: number,
  normal: Vector4
): Vector4 {
  const r = Math.sqrt(u1);
  const phi = 2 * Math.PI * u2;
  const xLocal = r * Math.cos(phi);
  const yLocal = r * Math.sin(phi);
  const zLocal = Math.sqrt(Math.max(0, 1 - u1));

  const [t, b] = orthonormalBasis(normal);
  return vector(
    t.x * xLocal + b.x * yLocal + normal.x * zLocal,
    t.y * xLocal + b.y * yLocal + normal.y * zLocal,
    t.z * xLocal + b.z * yLocal + normal.z * zLocal
  );
}
