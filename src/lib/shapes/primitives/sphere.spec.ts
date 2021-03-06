import { identityMatrix } from '../../matrices';
import { ray } from '../../rays';
import { point, vector, normalize, areEqual } from '../../tuples';
import { Sphere, glassSphere } from './sphere';

describe('Spheres', () => {
    test('a ray intersects a sphere at two points', () => {
        const r = ray(point(0, 0, -5), vector(0, 0, 1));
        const s = new Sphere();
        const xs = s.intersects(r);

        expect(xs.length).toBe(2);
        expect(xs[0].time).toEqual(4.0);
        expect(xs[1].time).toEqual(6.0);
    });

    test('a ray intersects a sphere at a tangent', () => {
        const r = ray(point(0, 1, -5), vector(0, 0, 1));
        const s = new Sphere();
        const xs = s.intersects(r);

        expect(xs.length).toBe(2);
        expect(xs[0].time).toEqual(5.0);
        expect(xs[1].time).toEqual(5.0);
    });

    test('a ray misses a sphere', () => {
        const r = ray(point(0, 2, -5), vector(0, 0, 1));
        const s = new Sphere();
        const xs = s.intersects(r);

        expect(xs.length).toBe(0);
    });

    test('a ray originates inside a sphere', () => {
        const r = ray(point(0, 0, 0), vector(0, 0, 1));
        const s = new Sphere();
        const xs = s.intersects(r);

        expect(xs.length).toBe(2);
        expect(xs[0].time).toEqual(-1.0);
        expect(xs[1].time).toEqual(1.0);
    });

    test('a sphere is behind a ray', () => {
        const r = ray(point(0, 0, 5), vector(0, 0, 1));
        const s = new Sphere();
        const xs = s.intersects(r);

        expect(xs.length).toBe(2);
        expect(xs[0].time).toEqual(-6.0);
        expect(xs[1].time).toEqual(-4.0);
    });

    test('intersect sets the object on the intersection', () => {
        const r = ray(point(0, 0, -5), vector(0, 0, 1));
        const s = new Sphere();
        const xs = s.intersects(r);

        expect(xs.length).toBe(2);
        expect(xs[0].object).toBe(s);
        expect(xs[1].object).toBe(s);
    });

    test('the normal on a sphere at a point on the x axis', () => {
        const s = new Sphere();
        const n = s.normalAt(point(1, 0, 0));
        expect(areEqual(n, vector(1, 0, 0))).toBe(true);
    });

    test('the normal on a sphere at a point on the y axis', () => {
        const s = new Sphere();
        const n = s.normalAt(point(0, 1, 0));
        expect(areEqual(n, vector(0, 1, 0))).toBe(true);
    });

    test('the normal on a sphere at a point on the z axis', () => {
        const s = new Sphere();
        const n = s.normalAt(point(0, 0, 1));
        expect(areEqual(n, vector(0, 0, 1))).toBe(true);
    });

    test('the normal on a sphere at a nonaxial point', () => {
        const a = Math.sqrt(3) / 3;
        const s = new Sphere();
        const n = s.normalAt(point(a, a, a));
        expect(areEqual(n, vector(a, a, a))).toBe(true);
    });

    test('the normal is a normalized vector', () => {
        const a = Math.sqrt(3) / 3;
        const s = new Sphere();
        const n = s.normalAt(point(a, a, a));
        expect(areEqual(n, normalize(n))).toBe(true);
    });

    test('a helper for producing a sphere with a glassy material', () => {
        const s = glassSphere();

        expect(s.transform).toStrictEqual(identityMatrix());
        expect(s.material.transparancy).toEqual(1.0);
        expect(s.material.refractiveIndex).toEqual(1.5);
    });

    test('the bounds of a sphere', () => {
        const s = new Sphere();
        const [min, max] = s.bounds();

        expect(min).toEqual(point(-1, -1, -1));
        expect(max).toEqual(point(1, 1, 1));
    });
});
