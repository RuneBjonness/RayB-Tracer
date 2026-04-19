import { Canvas } from '../canvas';
import { Vector4, point, pointFromF32Array } from '../math/vector4';
import { Ray, rayToTarget } from '../rays';
import { nextFloat01, reseed } from '../math/rng';
import { BufferBackedWorld } from '../world/buffer-backed-world';

export class BufferBackedCamera {
  private origin: Vector4;
  private invTransform: Float32Array;
  private pixelSize: number;
  private halfWidth: number;
  private halfHeight: number;
  private aperture: number;
  private focalDistance: number;
  private maxDepth: number;
  private width: number;

  constructor(buffer: ArrayBufferLike) {
    const f32view = new Float32Array(buffer);
    this.origin = pointFromF32Array(f32view);
    this.invTransform = new Float32Array(buffer, 4 * 4, 16);
    this.pixelSize = f32view[20];
    this.halfWidth = f32view[21];
    this.halfHeight = f32view[22];
    this.aperture = f32view[23];
    this.focalDistance = f32view[24];

    const u32view = new Uint32Array(buffer);
    this.maxDepth = u32view[25];
    this.width = u32view[26];
  }

  raysForPixel(x: number, y: number): Ray[] {
    const xOffset = (x + 0.5) * this.pixelSize;
    const yOffset = (y + 0.5) * this.pixelSize;
    const worldX = this.halfWidth - xOffset;
    const worldY = this.halfHeight - yOffset;

    const px = point(worldX, worldY, -1).applyMatrixBuffer(this.invTransform);

    const rays: Ray[] = [];
    // if (this.aperture > 0) {
    //   const fp = rayFocalPoint(this.origin, px, this.focalDistance);
    //   const samples = this.sampleApertureOrigins();
    //   for (let i = 0; i < samples.length; i++) {
    //     rays.push(rayToTarget(samples[i], fp));
    //   }
    // } else {
    rays.push(rayToTarget(this.origin, px));
    // }
    return rays;
  }

  rayForPixelJittered(x: number, y: number, rng: Uint32Array): Ray {
    const jx = nextFloat01(rng);
    const jy = nextFloat01(rng);
    const xOffset = (x + jx) * this.pixelSize;
    const yOffset = (y + jy) * this.pixelSize;
    const worldX = this.halfWidth - xOffset;
    const worldY = this.halfHeight - yOffset;
    const px = point(worldX, worldY, -1).applyMatrixBuffer(this.invTransform);
    return rayToTarget(this.origin, px);
  }

  // Render one Monte Carlo sample per pixel for the given tile and pass,
  // adding results into the 4-floats-per-pixel accumulator SharedArrayBuffer view.
  // The accumulator's global sample count is incremented by the driver
  // after all tiles of a pass finish.
  renderProgressiveTile(
    w: BufferBackedWorld,
    accFloats: Float32Array,
    accWidth: number,
    startX: number,
    startY: number,
    lengthX: number,
    lengthY: number,
    passIndex: number
  ): void {
    const rng = new Uint32Array(1);
    for (let dy = 0; dy < lengthY; dy++) {
      for (let dx = 0; dx < lengthX; dx++) {
        const px = startX + dx;
        const py = startY + dy;
        reseed(rng, px, py, passIndex, 0);
        const ray = this.rayForPixelJittered(px, py, rng);
        const color = w.progressiveColorAt(ray, this.maxDepth, rng);
        const idx = (py * accWidth + px) * 4;
        accFloats[idx] += color.r;
        accFloats[idx + 1] += color.g;
        accFloats[idx + 2] += color.b;
      }
    }
  }

  renderPart(
    w: BufferBackedWorld,
    startX: number,
    startY: number,
    lengthX: number,
    lengthY: number
  ): Canvas {
    const c = new Canvas(lengthX, lengthY);
    for (let y = 0; y < lengthY; y++) {
      for (let x = 0; x < lengthX; x++) {
        const rays = this.raysForPixel(startX + x, startY + y);
        if (rays.length === 1) {
          c.setColor(x, y, w.colorAt(rays[0], this.maxDepth));
          // } else {
          //   const sumSamples = w.colorAt(
          //     rays[0],
          //     this.maxDepth
          //   );
          //   let avgSampleColor = sumSamples.clone();
          //   let rayPassStartingIndex = 1;
          //   for (let p = 1; p < 9; p++) {
          //     const currentPassSampleCount = Math.min(
          //       this.uvSampleConfig.filter((cfg) => cfg.pass === p).length,
          //       rays.length - rayPassStartingIndex
          //     );
          //     for (
          //       let r = rayPassStartingIndex;
          //       r < rayPassStartingIndex + currentPassSampleCount;
          //       r++
          //     ) {
          //       sumSamples.add(
          //         w.colorAt(rays[r], this.maxDepth)
          //       );
          //     }
          //     const newAvgSampleColor = sumSamples
          //       .clone()
          //       .divideByScalar(rayPassStartingIndex + currentPassSampleCount);
          //     if (
          //       Math.abs(avgSampleColor.r - newAvgSampleColor.r) <=
          //         this.adaptiveSamplingColorSensitivity &&
          //       Math.abs(avgSampleColor.g - newAvgSampleColor.g) <=
          //         this.adaptiveSamplingColorSensitivity &&
          //       Math.abs(avgSampleColor.b - newAvgSampleColor.b) <=
          //         this.adaptiveSamplingColorSensitivity
          //     ) {
          //       avgSampleColor = newAvgSampleColor;
          //       break;
          //     }
          //     avgSampleColor = newAvgSampleColor;
          //     rayPassStartingIndex += currentPassSampleCount;
          //     if (rayPassStartingIndex >= rays.length) {
          //       break;
          //     }
          //   }
          //   c.pixels[x][y] = avgSampleColor;
        }
      }
    }
    return c;
  }
}
