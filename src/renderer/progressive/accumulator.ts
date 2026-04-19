// Progressive-render accumulator. Stores a running sum of samples per pixel
// (4 floats per pixel for vec4 alignment with the GPU layout) plus a global
// sample counter. Backed by SharedArrayBuffer so CPU workers can write samples
// directly without postMessage copies.
//
// The API keeps per-pixel sample counts as a future extension: replace meta[0]
// with a Uint32Array the same length as the pixel grid and divide per-pixel.

export type Accumulator = {
  width: number;
  height: number;
  floatsSab: SharedArrayBuffer;
  metaSab: SharedArrayBuffer;
  floats: Float32Array;
  meta: Uint32Array;
};

const FLOATS_PER_PIXEL = 4;
const META_SAMPLE_COUNT = 0;

export function createAccumulator(width: number, height: number): Accumulator {
  const floatsSab = new SharedArrayBuffer(
    width * height * FLOATS_PER_PIXEL * Float32Array.BYTES_PER_ELEMENT
  );
  const metaSab = new SharedArrayBuffer(4 * Uint32Array.BYTES_PER_ELEMENT);
  return {
    width,
    height,
    floatsSab,
    metaSab,
    floats: new Float32Array(floatsSab),
    meta: new Uint32Array(metaSab),
  };
}

export function resetAccumulator(acc: Accumulator): void {
  acc.floats.fill(0);
  acc.meta.fill(0);
}

export function sampleCount(acc: Accumulator): number {
  return acc.meta[META_SAMPLE_COUNT];
}

export function incrementSampleCount(acc: Accumulator): number {
  return ++acc.meta[META_SAMPLE_COUNT];
}

// Reinhard (c / (1 + c)) + gamma 2.2.
function tonemap(c: number): number {
  const mapped = c / (1 + c);
  return Math.pow(Math.max(0, mapped), 1 / 2.2);
}

export function resolveToImageData(
  acc: Accumulator,
  out: ImageData
): ImageData {
  const n = sampleCount(acc);
  if (n === 0) {
    out.data.fill(0);
    return out;
  }
  const inv = 1 / n;
  const src = acc.floats;
  const dst = out.data;
  const pixels = acc.width * acc.height;
  for (let i = 0; i < pixels; i++) {
    const si = i * FLOATS_PER_PIXEL;
    const di = i * 4;
    dst[di] = Math.min(255, tonemap(src[si] * inv) * 255);
    dst[di + 1] = Math.min(255, tonemap(src[si + 1] * inv) * 255);
    dst[di + 2] = Math.min(255, tonemap(src[si + 2] * inv) * 255);
    dst[di + 3] = 255;
  }
  return out;
}
