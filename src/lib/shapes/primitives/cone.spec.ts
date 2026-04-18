import { describe, expect, test } from 'vitest';
import { Ray } from '../../rays';
import { Cone } from './cone';
import { point, vector } from '../../math/vector4';

describe('Cones', () => {
  test.each`
    origin             | direction              | t0         | t1
    ${point(0, 0, -5)} | ${vector(0, 0, 1)}     | ${5}       | ${5}
    ${point(0, 0, -5)} | ${vector(1, 1, 1)}     | ${8.66025} | ${8.66025}
    ${point(1, 1, -5)} | ${vector(-0.5, -1, 1)} | ${4.55006} | ${49.44994}
  `('intersecting a cone with a ray', ({ origin, direction, t0, t1 }) => {
    const c = new Cone();
    const r = new Ray(origin, direction.normalize());
    const xs = c.intersects(r);
    const hit = c.hits(r, 10);

    expect(xs.length).toEqual(2);
    expect(xs[0].time).toBeCloseTo(t0);
    expect(xs[1].time).toBeCloseTo(t1);
    expect(hit).toBeTruthy();
  });

  test('intersecting a cone with a ray parallel to one of its halves', () => {
    const c = new Cone();
    const r = new Ray(point(0, 0, -1), vector(0, 1, 1).normalize());
    const xs = c.intersects(r);
    const hit = c.hits(r, 10);

    expect(xs.length).toEqual(1);
    expect(xs[0].time).toBeCloseTo(0.35355);
    expect(hit).toBeTruthy();
  });

  test.each`
    origin                | direction          | count | hits
    ${point(0, 0, -5)}    | ${vector(0, 1, 0)} | ${0}  | ${false}
    ${point(0, 0, -0.25)} | ${vector(0, 1, 1)} | ${2}  | ${true}
    ${point(0, 0, -0.25)} | ${vector(0, 1, 0)} | ${4}  | ${true}
  `(
    'intersecting the caps of a closed cone',
    ({ origin, direction, count, hits }) => {
      const c = new Cone(-0.5, 0.5, true);
      const r = new Ray(origin, direction.normalize());
      const xs = c.intersects(r);
      const hit = c.hits(r, 10);

      expect(xs.length).toEqual(count);
      expect(hit).toBe(hits);
    }
  );

  test.each`
    point               | normal
    ${point(0, 0, 0)}   | ${vector(0, 0, 0).normalize()}
    ${point(1, 1, 1)}   | ${vector(1, -Math.sqrt(2), 1).normalize()}
    ${point(-1, -1, 0)} | ${vector(-1, 1, 0).normalize()}
  `('the normal on a cone', ({ point: p, normal }) => {
    const c = new Cone();
    const n = c.normalAt(p);

    expect(n.equals(normal)).toBe(true);
  });

  test('the bounds of a unbounded cone', () => {
    const c = new Cone();

    expect(c.localBounds?.min).toEqual(
      point(
        Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY
      )
    );
    expect(c.localBounds?.max).toEqual(
      point(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY
      )
    );
  });

  test('the bounds of a cone', () => {
    const c = new Cone(-5, 3);

    expect(c.localBounds?.min).toEqual(point(-5, -5, -5));
    expect(c.localBounds?.max).toEqual(point(5, 3, 5));
  });
});
