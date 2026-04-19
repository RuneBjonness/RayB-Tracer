import { expect, test } from 'vitest';
import { vector } from './vector4';
import {
  nextFloat01,
  nextU32,
  pcgHash,
  reseed,
  sampleHemisphereCosine,
} from './rng';

test('pcgHash stays in u32 range', () => {
  for (const input of [0, 1, 42, 0xffffffff, 0x12345678, 0xdeadbeef]) {
    const h = pcgHash(input);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
    expect(Number.isInteger(h)).toBe(true);
  }
});

test('reseed is deterministic for the same key', () => {
  const a = new Uint32Array(1);
  const b = new Uint32Array(1);
  reseed(a, 123, 456, 7, 2);
  reseed(b, 123, 456, 7, 2);
  expect(a[0]).toBe(b[0]);
});

test('reseed decorrelates different streams on the same pass', () => {
  const s0 = new Uint32Array(1);
  const s1 = new Uint32Array(1);
  reseed(s0, 10, 20, 3, 0);
  reseed(s1, 10, 20, 3, 1);
  expect(s0[0]).not.toBe(s1[0]);
  // Different passes too.
  const s2 = new Uint32Array(1);
  reseed(s2, 10, 20, 4, 0);
  expect(s0[0]).not.toBe(s2[0]);
});

test('nextU32 produces a different value than the seed and advances state', () => {
  const s = new Uint32Array(1);
  reseed(s, 1, 2, 3, 4);
  const seed = s[0];
  const v1 = nextU32(s);
  const v2 = nextU32(s);
  expect(v1).not.toBe(seed);
  expect(v2).not.toBe(v1);
});

test('nextFloat01 returns values in [0, 1)', () => {
  const s = new Uint32Array(1);
  reseed(s, 42, 99, 0, 0);
  for (let i = 0; i < 1000; i++) {
    const f = nextFloat01(s);
    expect(f).toBeGreaterThanOrEqual(0);
    expect(f).toBeLessThan(1);
  }
});

test('nextFloat01 is roughly uniform over many samples', () => {
  const s = new Uint32Array(1);
  reseed(s, 1, 1, 1, 1);
  let sum = 0;
  const n = 100_000;
  for (let i = 0; i < n; i++) sum += nextFloat01(s);
  const mean = sum / n;
  expect(mean).toBeGreaterThan(0.48);
  expect(mean).toBeLessThan(0.52);
});

test('sampleHemisphereCosine points into the hemisphere of the normal', () => {
  const n = vector(0, 1, 0);
  const s = new Uint32Array(1);
  reseed(s, 0, 0, 0, 0);
  for (let i = 0; i < 500; i++) {
    const u1 = nextFloat01(s);
    const u2 = nextFloat01(s);
    const dir = sampleHemisphereCosine(u1, u2, n);
    const dot = dir.x * n.x + dir.y * n.y + dir.z * n.z;
    expect(dot).toBeGreaterThanOrEqual(-1e-6);
    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
    expect(len).toBeGreaterThan(0.99);
    expect(len).toBeLessThan(1.01);
  }
});

test('sampleHemisphereCosine works for a negative-z normal (branchless basis)', () => {
  const n = vector(0, 0, -1);
  const s = new Uint32Array(1);
  reseed(s, 0, 0, 0, 0);
  for (let i = 0; i < 200; i++) {
    const u1 = nextFloat01(s);
    const u2 = nextFloat01(s);
    const dir = sampleHemisphereCosine(u1, u2, n);
    const dot = dir.x * n.x + dir.y * n.y + dir.z * n.z;
    expect(dot).toBeGreaterThanOrEqual(-1e-6);
  }
});
