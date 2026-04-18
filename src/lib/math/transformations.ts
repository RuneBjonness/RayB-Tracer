import { Matrix4 } from './matrices';
import { Vector4 } from './vector4';

export function translation(x: number, y: number, z: number): Matrix4 {
  let m = new Matrix4();
  m.elements[3] = x;
  m.elements[7] = y;
  m.elements[11] = z;
  return m;
}

export function scaling(x: number, y: number, z: number): Matrix4 {
  let m = new Matrix4();
  m.elements[0] = x;
  m.elements[5] = y;
  m.elements[10] = z;
  return m;
}

export function radians(deg: number): number {
  return (deg / 180) * Math.PI;
}

export function rotationX(rad: number): Matrix4 {
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);
  // prettier-ignore
  return new Matrix4([
    1, 0, 0, 0,
    0, cosR, -sinR, 0,
    0, sinR, cosR, 0,
    0, 0, 0, 1,
  ]);
}

export function rotationY(rad: number): Matrix4 {
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);
  // prettier-ignore
  return new Matrix4([
    cosR, 0, sinR, 0,
    0, 1, 0, 0,
    -sinR, 0, cosR, 0,
    0, 0, 0, 1,
  ]);
}

export function rotationZ(rad: number): Matrix4 {
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);
  // prettier-ignore
  return new Matrix4([
    cosR, -sinR, 0, 0,
    sinR, cosR, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

export function shearing(
  xy: number,
  xz: number,
  yx: number,
  yz: number,
  zx: number,
  zy: number
): Matrix4 {
  // prettier-ignore
  return new Matrix4([
    1, xy, xz, 0,
    yx, 1, yz, 0,
    zx, zy, 1, 0,
    0, 0, 0, 1,
  ]);
}

export function viewTransform(
  from: Vector4,
  to: Vector4,
  up: Vector4
): Matrix4 {
  const forward = to.clone().subtract(from).normalize();
  const upn = up.clone().normalize();
  const left = forward.clone().cross(upn);
  const trueUp = left.clone().cross(forward);

  // prettier-ignore
  const orientation = new Matrix4([
    left.x, left.y, left.z, 0,
    trueUp.x, trueUp.y, trueUp.z, 0,
    -forward.x, -forward.y, -forward.z, 0,
    0, 0, 0, 1,
  ]);
  return orientation.multiply(translation(-from.x, -from.y, -from.z));
}
