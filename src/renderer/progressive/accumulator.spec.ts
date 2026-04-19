import { expect, test } from 'vitest';
import {
  createAccumulator,
  incrementSampleCount,
  resetAccumulator,
  resolveToImageData,
  sampleCount,
} from './accumulator';

// Minimal ImageData stand-in so specs run under the default node environment
// without pulling in jsdom. The resolver only touches `.data`.
function mockImageData(w: number, h: number): ImageData {
  return { data: new Uint8ClampedArray(w * h * 4) } as ImageData;
}

test('createAccumulator zero-initializes floats and meta', () => {
  const acc = createAccumulator(4, 3);
  expect(acc.width).toBe(4);
  expect(acc.height).toBe(3);
  expect(acc.floats.length).toBe(4 * 3 * 4);
  expect(sampleCount(acc)).toBe(0);
  for (const v of acc.floats) expect(v).toBe(0);
});

test('resetAccumulator zeroes floats and sample count', () => {
  const acc = createAccumulator(2, 2);
  acc.floats.fill(1.5);
  incrementSampleCount(acc);
  incrementSampleCount(acc);
  expect(sampleCount(acc)).toBe(2);

  resetAccumulator(acc);
  expect(sampleCount(acc)).toBe(0);
  for (const v of acc.floats) expect(v).toBe(0);
});

test('resolveToImageData with zero samples returns all-zero pixels', () => {
  const acc = createAccumulator(2, 2);
  const img = mockImageData(2, 2);
  img.data.fill(77);
  resolveToImageData(acc, img);
  for (const v of img.data) expect(v).toBe(0);
});

test('resolveToImageData averages and tonemaps linear samples', () => {
  const acc = createAccumulator(1, 1);
  // Four samples each contributing pure red (r=1.0).
  for (let s = 0; s < 4; s++) {
    acc.floats[0] += 1.0;
    acc.floats[1] += 0.0;
    acc.floats[2] += 0.0;
    incrementSampleCount(acc);
  }
  const img = mockImageData(1, 1);
  resolveToImageData(acc, img);

  // Averaged r = 1, Reinhard: 1/(1+1) = 0.5, gamma 2.2: 0.5^(1/2.2) ≈ 0.7297
  // * 255 ≈ 186
  expect(img.data[0]).toBeGreaterThan(180);
  expect(img.data[0]).toBeLessThan(192);
  expect(img.data[1]).toBe(0);
  expect(img.data[2]).toBe(0);
  expect(img.data[3]).toBe(255);
});

test('resolveToImageData clamps HDR values below 255', () => {
  const acc = createAccumulator(1, 1);
  // One sample with huge radiance — Reinhard should compress toward 1.
  acc.floats[0] = 1000;
  acc.floats[1] = 1000;
  acc.floats[2] = 1000;
  incrementSampleCount(acc);
  const img = mockImageData(1, 1);
  resolveToImageData(acc, img);

  expect(img.data[0]).toBeGreaterThan(240);
  expect(img.data[0]).toBeLessThanOrEqual(255);
  expect(img.data[3]).toBe(255);
});
