import { equals } from './common';
import {
  rotationX,
  rotationY,
  rotationZ,
  scaling,
  shearing,
  translation,
} from './transformations';

// prettier-ignore
export type Matrix4Elements = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
];

export enum MatrixOrder {
  RowMajor,
  ColumnMajor,
}

export class Matrix4 {
  public elements: Matrix4Elements;

  constructor(elements?: Matrix4Elements) {
    // prettier-ignore
    this.elements = elements ?? [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
  }

  public clone(): Matrix4 {
    return new Matrix4(this.cloneElements());
  }

  public cloneElements(): Matrix4Elements {
    return [
      this.elements[0],
      this.elements[1],
      this.elements[2],
      this.elements[3],
      this.elements[4],
      this.elements[5],
      this.elements[6],
      this.elements[7],
      this.elements[8],
      this.elements[9],
      this.elements[10],
      this.elements[11],
      this.elements[12],
      this.elements[13],
      this.elements[14],
      this.elements[15],
    ];
  }

  // prettier-ignore
  public multiply(m: Matrix4): Matrix4 {
    let t0 = this.elements[0];
    let t1 = this.elements[1];
    let t2 = this.elements[2];
    this.elements[0] = t0 * m.elements[0] + t1 * m.elements[4] + t2 * m.elements[8] + this.elements[3] * m.elements[12];
    this.elements[1] = t0 * m.elements[1] + t1 * m.elements[5] + t2 * m.elements[9] + this.elements[3] * m.elements[13];
    this.elements[2] = t0 * m.elements[2] + t1 * m.elements[6] + t2 * m.elements[10] + this.elements[3] * m.elements[14];
    this.elements[3] = t0 * m.elements[3] + t1 * m.elements[7] + t2 * m.elements[11] + this.elements[3] * m.elements[15];

    t0 = this.elements[4];
    t1 = this.elements[5];
    t2 = this.elements[6];
    this.elements[4] = t0 * m.elements[0] + t1 * m.elements[4] + t2 * m.elements[8] + this.elements[7] * m.elements[12];
    this.elements[5] = t0 * m.elements[1] + t1 * m.elements[5] + t2 * m.elements[9] + this.elements[7] * m.elements[13];
    this.elements[6] = t0 * m.elements[2] + t1 * m.elements[6] + t2 * m.elements[10] + this.elements[7] * m.elements[14];
    this.elements[7] = t0 * m.elements[3] + t1 * m.elements[7] + t2 * m.elements[11] + this.elements[7] * m.elements[15];

    t0 = this.elements[8];
    t1 = this.elements[9];
    t2 = this.elements[10];
    this.elements[8] = t0 * m.elements[0] + t1 * m.elements[4] + t2 * m.elements[8] + this.elements[11] * m.elements[12];
    this.elements[9] = t0 * m.elements[1] + t1 * m.elements[5] + t2 * m.elements[9] + this.elements[11] * m.elements[13];
    this.elements[10] = t0 * m.elements[2] + t1 * m.elements[6] + t2 * m.elements[10] + this.elements[11] * m.elements[14];
    this.elements[11] = t0 * m.elements[3] + t1 * m.elements[7] + t2 * m.elements[11] + this.elements[11] * m.elements[15];

    t0 = this.elements[12];
    t1 = this.elements[13];
    t2 = this.elements[14];
    this.elements[12] = t0 * m.elements[0] + t1 * m.elements[4] + t2 * m.elements[8] + this.elements[15] * m.elements[12];
    this.elements[13] = t0 * m.elements[1] + t1 * m.elements[5] + t2 * m.elements[9] + this.elements[15] * m.elements[13];
    this.elements[14] = t0 * m.elements[2] + t1 * m.elements[6] + t2 * m.elements[10] + this.elements[15] * m.elements[14];
    this.elements[15] = t0 * m.elements[3] + t1 * m.elements[7] + t2 * m.elements[11] + this.elements[15] * m.elements[15];
  
    return this;
  }

  public transpose(): Matrix4 {
    let tmp = this.elements[1];
    this.elements[1] = this.elements[4];
    this.elements[4] = tmp;

    tmp = this.elements[2];
    this.elements[2] = this.elements[8];
    this.elements[8] = tmp;

    tmp = this.elements[6];
    this.elements[6] = this.elements[9];
    this.elements[9] = tmp;

    tmp = this.elements[3];
    this.elements[3] = this.elements[12];
    this.elements[12] = tmp;

    tmp = this.elements[7];
    this.elements[7] = this.elements[13];
    this.elements[13] = tmp;

    tmp = this.elements[11];
    this.elements[11] = this.elements[14];
    this.elements[14] = tmp;

    return this;
  }

  public inverse(): Matrix4 {
    const m = this.cloneElements();
    const x00 = m[0] * m[5] - m[1] * m[4];
    const x01 = m[0] * m[6] - m[2] * m[4];
    const x02 = m[0] * m[7] - m[3] * m[4];
    const x03 = m[1] * m[6] - m[2] * m[5];
    const x04 = m[1] * m[7] - m[3] * m[5];
    const x05 = m[2] * m[7] - m[3] * m[6];
    const x06 = m[8] * m[13] - m[9] * m[12];
    const x07 = m[8] * m[14] - m[10] * m[12];
    const x08 = m[8] * m[15] - m[11] * m[12];
    const x09 = m[9] * m[14] - m[10] * m[13];
    const x10 = m[9] * m[15] - m[11] * m[13];
    const x11 = m[10] * m[15] - m[11] * m[14];

    let determinant =
      x00 * x11 - x01 * x10 + x02 * x09 + x03 * x08 - x04 * x07 + x05 * x06;

    if (determinant === 0) {
      // prettier-ignore
      this.elements = [
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
    ];
      return this;
    }

    determinant = 1.0 / determinant;

    this.elements[0] = (m[5] * x11 - m[6] * x10 + m[7] * x09) * determinant;
    this.elements[1] = (m[2] * x10 - m[1] * x11 - m[3] * x09) * determinant;
    this.elements[2] = (m[13] * x05 - m[14] * x04 + m[15] * x03) * determinant;
    this.elements[3] = (m[10] * x04 - m[9] * x05 - m[11] * x03) * determinant;
    this.elements[4] = (m[6] * x08 - m[4] * x11 - m[7] * x07) * determinant;
    this.elements[5] = (m[0] * x11 - m[2] * x08 + m[3] * x07) * determinant;
    this.elements[6] = (m[14] * x02 - m[12] * x05 - m[15] * x01) * determinant;
    this.elements[7] = (m[8] * x05 - m[10] * x02 + m[11] * x01) * determinant;
    this.elements[8] = (m[4] * x10 - m[5] * x08 + m[7] * x06) * determinant;
    this.elements[9] = (m[1] * x08 - m[0] * x10 - m[3] * x06) * determinant;
    this.elements[10] = (m[12] * x04 - m[13] * x02 + m[15] * x00) * determinant;
    this.elements[11] = (m[9] * x02 - m[8] * x04 - m[11] * x00) * determinant;
    this.elements[12] = (m[5] * x07 - m[4] * x09 - m[6] * x06) * determinant;
    this.elements[13] = (m[0] * x09 - m[1] * x07 + m[2] * x06) * determinant;
    this.elements[14] = (m[13] * x01 - m[12] * x03 - m[14] * x00) * determinant;
    this.elements[15] = (m[8] * x03 - m[9] * x01 + m[10] * x00) * determinant;

    return this;
  }

  public equals(m: Matrix4): boolean {
    for (let i = 0; i < 16; i++) {
      if (!equals(this.elements[i], m.elements[i])) {
        return false;
      }
    }
    return true;
  }

  public translate(x: number, y: number, z: number): Matrix4 {
    this.elements = translation(x, y, z).multiply(this).elements;
    return this;
  }

  public scale(x: number, y: number, z: number): Matrix4 {
    this.elements = scaling(x, y, z).multiply(this).elements;
    return this;
  }

  public rotateX(radians: number): Matrix4 {
    this.elements = rotationX(radians).multiply(this).elements;
    return this;
  }

  public rotateY(radians: number): Matrix4 {
    this.elements = rotationY(radians).multiply(this).elements;
    return this;
  }

  public rotateZ(radians: number): Matrix4 {
    this.elements = rotationZ(radians).multiply(this).elements;
    return this;
  }

  public shear(
    xy: number,
    xz: number,
    yx: number,
    yz: number,
    zx: number,
    zy: number
  ): Matrix4 {
    this.elements = shearing(xy, xz, yx, yz, zx, zy).multiply(this).elements;
    return this;
  }

  public copyToArrayBuffer(
    buffer: ArrayBufferLike,
    offset: number,
    order: MatrixOrder
  ): void {
    const view = new Float32Array(buffer, offset, 16);
    if (order === MatrixOrder.RowMajor) {
      view.set(this.elements, 0);
    } else {
      view[0] = this.elements[0];
      view[1] = this.elements[4];
      view[2] = this.elements[8];
      view[3] = this.elements[12];
      view[4] = this.elements[1];
      view[5] = this.elements[5];
      view[6] = this.elements[9];
      view[7] = this.elements[13];
      view[8] = this.elements[2];
      view[9] = this.elements[6];
      view[10] = this.elements[10];
      view[11] = this.elements[14];
      view[12] = this.elements[3];
      view[13] = this.elements[7];
      view[14] = this.elements[11];
      view[15] = this.elements[15];
    }
  }
}
