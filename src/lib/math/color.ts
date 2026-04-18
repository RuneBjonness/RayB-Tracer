import { equals } from './common';

export class Color {
  constructor(
    public r: number,
    public g: number,
    public b: number
  ) {}

  public clone(): Color {
    return new Color(this.r, this.g, this.b);
  }

  public equals(c: Color): boolean {
    return equals(this.r, c.r) && equals(this.g, c.g) && equals(this.b, c.b);
  }

  public add(c: Color): Color {
    this.r += c.r;
    this.g += c.g;
    this.b += c.b;
    return this;
  }

  public subtract(c: Color): Color {
    this.r -= c.r;
    this.g -= c.g;
    this.b -= c.b;
    return this;
  }

  public multiplyByScalar(scalar: number): Color {
    this.r *= scalar;
    this.g *= scalar;
    this.b *= scalar;
    return this;
  }

  public divideByScalar(scalar: number): Color {
    return this.multiplyByScalar(1 / scalar);
  }

  public multiply(c: Color): Color {
    this.r *= c.r;
    this.g *= c.g;
    this.b *= c.b;
    return this;
  }

  public blend(c: Color): Color {
    this.r = (this.r + c.r) * 0.5;
    this.g = (this.g + c.g) * 0.5;
    this.b = (this.b + c.b) * 0.5;
    return this;
  }
}

export function colorFromRgbUint8(r: number, g: number, b: number): Color {
  return new Color(r / 255, g / 255, b / 255);
}

export function colorFromHex(hex: string): Color {
  if (hex.length !== 7 || hex[0] !== '#') {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  try {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return colorFromRgbUint8(r, g, b);
  } catch (e) {
    throw new Error(`Invalid hex color: ${hex} (${JSON.stringify(e)})`, {
      cause: e,
    });
  }
}
