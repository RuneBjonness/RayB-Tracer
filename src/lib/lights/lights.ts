import { Matrix4 } from '../math/matrices';
import { Cube } from '../shapes/primitives/cube';
import { scaling } from '../math/transformations';
import { World } from '../world/world';
import { Color } from '../math/color';
import { Vector4, point, vector } from '../math/vector4';
import { Material, material } from '../material/materials';

export interface Light {
  intensity: Color;
  shapeIdx: number;
  samplePassCounts: number[];
  maxSamples: number;
  adaptiveSampleSensitivity: number;

  intensityAt(p: Vector4, w: World): number;
  samplePoints(): Vector4[];

  copyLightToArrayBuffer(buffer: ArrayBufferLike, offset: number): void;
}

export class PointLight implements Light {
  shapeIdx = 0;
  samplePassCounts = [1];
  maxSamples = 1;
  adaptiveSampleSensitivity = 1;

  constructor(
    private position: Vector4,
    public intensity: Color
  ) {}

  samplePoints(): Vector4[] {
    return [this.position];
  }

  intensityAt(p: Vector4, w: World): number {
    return w.isShadowed(p, this.samplePoints()[0]) ? 0.0 : 1.0;
  }

  copyLightToArrayBuffer(buffer: ArrayBufferLike, offset: number): void {
    const f32view = new Float32Array(buffer, offset, 8);
    f32view[0] = this.intensity.r;
    f32view[1] = this.intensity.g;
    f32view[2] = this.intensity.b;
    f32view[4] = this.position.x;
    f32view[5] = this.position.y;
    f32view[6] = this.position.z;

    const u32view = new Uint32Array(buffer, offset, 8);
    u32view[7] = this.shapeIdx;
  }
}

export class AreaLight extends Cube implements Light {
  get transform() {
    return super.transform;
  }
  set transform(m: Matrix4) {
    super.transform = m.multiply(scaling(1, 0.001, 1));
  }

  shapeIdx = 0;
  samplePassCounts = Array.from<number>({ length: 7 });

  private corner: Vector4;
  private uVec: Vector4;
  private vVec: Vector4;
  private uvSampleConfig = this.initUvSampleConfig();

  constructor(
    public intensity: Color,
    public maxSamples: number,
    public adaptiveSampleSensitivity: number,
    materials: Material[]
  ) {
    super();
    this.transform = new Matrix4();

    const mat = material();
    mat.color = intensity;
    mat.diffuse = 0;
    mat.specular = 0;
    mat.ambient = 1;
    materials.push(mat);
    this.materialDefinitions = materials;
    this.material = mat;

    this.corner = point(-1, -1.001, -1);
    this.uVec = vector(2, 0, 0).divide(7);
    this.vVec = vector(0, 0, 2).divide(7);

    for (let i = 0; i < this.samplePassCounts.length; i++) {
      this.samplePassCounts[i] = this.uvSampleConfig.filter(
        (cfg) => cfg.pass === i
      ).length;
    }
  }

  samplePoints(): Vector4[] {
    if (this.maxSamples === 1) {
      return [this.pointOnLight(3, 3, false)];
    }

    return this.uvSampleConfig
      .slice(0, this.maxSamples)
      .map((s) => this.pointOnLight(s.u, s.v));
  }

  intensityAt(p: Vector4, w: World): number {
    if (this.maxSamples === 1) {
      return w.isShadowed(p, this.pointOnLight(3, 3, false)) ? 0.0 : 1.0;
    }

    const samples = this.samplePoints();
    let sumSampleIntensity = w.isShadowed(p, samples[0]) ? 0.0 : 1.0;
    let avgSampleIntensity = sumSampleIntensity;
    let passStartingIndex = 1;

    for (let pass = 1; pass < 7; pass++) {
      const currentPassSampleCount = Math.min(
        this.samplePassCounts[pass],
        samples.length - passStartingIndex
      );

      for (
        let pi = passStartingIndex;
        pi < passStartingIndex + currentPassSampleCount;
        pi++
      ) {
        if (!w.isShadowed(p, samples[pi])) {
          sumSampleIntensity += 1.0;
        }
      }
      const newAvgSampleIntensity =
        sumSampleIntensity / (passStartingIndex + currentPassSampleCount);

      if (
        Math.abs(avgSampleIntensity - newAvgSampleIntensity) <=
        this.adaptiveSampleSensitivity
      ) {
        avgSampleIntensity = newAvgSampleIntensity;
        break;
      }
      avgSampleIntensity = newAvgSampleIntensity;
      passStartingIndex += currentPassSampleCount;

      if (passStartingIndex >= samples.length) {
        break;
      }
    }
    return avgSampleIntensity;
  }

  copyLightToArrayBuffer(buffer: ArrayBufferLike, offset: number): void {
    const f32view = new Float32Array(buffer, offset, 8);
    f32view[0] = this.intensity.r;
    f32view[1] = this.intensity.g;
    f32view[2] = this.intensity.b;

    const pos = this.pointOnLight(3, 3, false);
    f32view[4] = pos.x;
    f32view[5] = pos.y;
    f32view[6] = pos.z;

    const u32view = new Uint32Array(buffer, offset, 8);
    u32view[7] = this.shapeIdx;
  }

  private pointOnLight(u: number, v: number, applyNoise = true): Vector4 {
    return this.pointToWorld(
      this.corner
        .clone()
        .add(this.uVec.clone().scale(u + (applyNoise ? Math.random() : 0.5)))
        .add(this.vVec.clone().scale(v + (applyNoise ? Math.random() : 0.5)))
    );
  }

  private initUvSampleConfig() {
    // prettier-ignore
    return [
      1, 4, 5, 2, 5, 4, 1,
      4, 3, 6, 3, 6, 3, 4,
      5, 6, 4, 5, 4, 6, 5,
      2, 3, 5, 0, 5, 3, 2,
      5, 6, 4, 5, 4, 6, 5,
      4, 3, 6, 3, 6, 3, 4,
      1, 4, 5, 2, 5, 4, 1,
    ]
      .map((val, idx) => {
        return { pass: val, u: Math.floor(idx / 7), v: idx % 7 };
      })
      .sort((a, b) => a.pass - b.pass);
  }
}
