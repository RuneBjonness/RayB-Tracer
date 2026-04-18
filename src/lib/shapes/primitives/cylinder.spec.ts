import { describe, expect, test } from 'vitest';
import { Ray } from '../../rays';
import { Cylinder } from './cylinder';
import { point, vector } from '../../math/vector4';

describe('Cylinders', () => {
  test.each`
    origin             | direction
    ${point(1, 0, 0)}  | ${vector(0, 1, 0)}
    ${point(0, 0, 0)}  | ${vector(0, 1, 0)}
    ${point(0, 0, -5)} | ${vector(1, 1, 1)}
  `('a ray misses a cylinder', ({ origin, direction }) => {
    const c = new Cylinder();
    const r = new Ray(origin, direction.normalize());
    const xs = c.intersects(r);
    const hit = c.hits(r, 10);

    expect(xs.length).toEqual(0);
    expect(hit).toBeFalsy();
  });

  test.each`
    origin               | direction            | t0         | t1
    ${point(1, 0, -5)}   | ${vector(0, 0, 1)}   | ${5}       | ${5}
    ${point(0, 0, -5)}   | ${vector(0, 0, 1)}   | ${4}       | ${6}
    ${point(0.5, 0, -5)} | ${vector(0.1, 1, 1)} | ${6.80798} | ${7.08872}
  `('a ray strikes a cylinder', ({ origin, direction, t0, t1 }) => {
    const c = new Cylinder();
    const r = new Ray(origin, direction.normalize());
    const xs = c.intersects(r);
    const hit = c.hits(r, 10);

    expect(xs.length).toEqual(2);
    expect(xs[0].time).toBeCloseTo(t0);
    expect(xs[1].time).toBeCloseTo(t1);
    expect(hit).toBeTruthy();
  });

  test.each`
    point              | normal
    ${point(1, 0, 0)}  | ${vector(1, 0, 0)}
    ${point(0, 5, -1)} | ${vector(0, 0, -1)}
    ${point(0, -2, 1)} | ${vector(0, 0, 1)}
    ${point(-1, 1, 0)} | ${vector(-1, 0, 0)}
  `('the normal on a cylinder', ({ point: p, normal }) => {
    const c = new Cylinder();
    const n = c.normalAt(p);

    expect(n.equals(normal)).toBe(true);
  });

  test.each`
    origin               | direction            | count | hits
    ${point(0, 1.5, 0)}  | ${vector(0.1, 1, 0)} | ${0}  | ${false}
    ${point(0, 3, -5)}   | ${vector(0, 0, 1)}   | ${0}  | ${false}
    ${point(0, 0, -5)}   | ${vector(0, 0, 1)}   | ${0}  | ${false}
    ${point(0, 2, -5)}   | ${vector(0, 0, 1)}   | ${0}  | ${false}
    ${point(0, 1, -5)}   | ${vector(0, 0, 1)}   | ${0}  | ${false}
    ${point(0, 1.5, -2)} | ${vector(0, 0, 1)}   | ${2}  | ${true}
  `(
    'a ray strikes a truncated cylinder',
    ({ origin, direction, count, hits }) => {
      const c = new Cylinder(1, 2);
      const r = new Ray(origin, direction.normalize());
      const xs = c.intersects(r);
      const hit = c.hits(r, 10);

      expect(xs.length).toEqual(count);
      expect(hit).toBe(hits);
    }
  );

  test.each`
    origin              | direction           | count
    ${point(0, 3, 0)}   | ${vector(0, -1, 0)} | ${2}
    ${point(0, 3, -2)}  | ${vector(0, -1, 2)} | ${2}
    ${point(0, 4, -2)}  | ${vector(0, -1, 1)} | ${2}
    ${point(0, 0, -2)}  | ${vector(0, 1, 2)}  | ${2}
    ${point(0, -1, -2)} | ${vector(0, 1, 1)}  | ${2}
  `(
    'intersecting the caps of a closed cylinder',
    ({ origin, direction, count }) => {
      const c = new Cylinder(1, 2, true);
      const r = new Ray(origin, direction.normalize());
      const xs = c.intersects(r);
      const hit = c.hits(r, 10);

      expect(xs.length).toEqual(count);
      expect(hit).toBeTruthy();
    }
  );

  test.each`
    point               | normal
    ${point(0, 1, 0)}   | ${vector(0, -1, 0)}
    ${point(0.5, 1, 0)} | ${vector(0, -1, 0)}
    ${point(0, 1, 0.5)} | ${vector(0, -1, 0)}
    ${point(0, 2, 0)}   | ${vector(0, 1, 0)}
    ${point(0.5, 2, 0)} | ${vector(0, 1, 0)}
    ${point(0, 2, 0.5)} | ${vector(0, 1, 0)}
  `("the normal vector on a cylinder's end caps", ({ point: p, normal }) => {
    const c = new Cylinder(1, 2, true);
    const n = c.normalAt(p);

    expect(n.equals(normal)).toBe(true);
  });

  test('the default bounds of a cylinder', () => {
    const c = new Cylinder();

    expect(c.localBounds?.min).toEqual(point(-1, Number.NEGATIVE_INFINITY, -1));
    expect(c.localBounds?.max).toEqual(point(1, Number.POSITIVE_INFINITY, 1));
  });

  test('the bounds of a truncated cylinder', () => {
    const c = new Cylinder(-5, 5);

    expect(c.localBounds?.min).toEqual(point(-1, -5, -1));
    expect(c.localBounds?.max).toEqual(point(1, 5, 1));
  });
});
