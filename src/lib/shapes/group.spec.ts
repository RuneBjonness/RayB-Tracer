import { areEqual, identityMatrix } from '../matrices';
import { ray } from '../rays';
import { translation, scaling, rotationY } from '../transformations';
import { point, vector, areEqual as tuplesAreEqual } from '../tuples';
import { Group } from './group';
import { Cylinder } from './primitives/cylinder';
import { Sphere } from './primitives/sphere';
import { TestShape } from './shape';

describe('Groups', () => {
    test('creating a new group', () => {
        const g = new Group();

        expect(areEqual(g.transform, identityMatrix())).toBe(true);
        expect(g.shapes.length).toBe(0);
    });

    test('adding a child to a group', () => {
        const g = new Group();
        const s = new TestShape();

        g.add(s);

        expect(g.shapes.indexOf(s)).toBeGreaterThanOrEqual(0);
        expect(s.parent).toBe(g);
    });

    test('intersecting a ray with an empty group', () => {
        const g = new Group();
        const xs = g.intersects(ray(point(0, 0, 0), vector(0, 0, 1)));

        expect(xs.length).toBe(0);
    });

    test('intersecting a ray with a nonempty group', () => {
        const g = new Group();
        const s1 = new Sphere();
        const s2 = new Sphere();
        s2.transform = translation(0, 0, -3);
        const s3 = new Sphere();
        s3.transform = translation(5, 0, 0);

        g.add(s1);
        g.add(s2);
        g.add(s3);

        const xs = g.intersects(ray(point(0, 0, -5), vector(0, 0, 1)));

        expect(xs.length).toBe(4);
        expect(xs[0].object).toBe(s2);
        expect(xs[1].object).toBe(s2);
        expect(xs[2].object).toBe(s1);
        expect(xs[3].object).toBe(s1);
    });

    test('intersecting a transformed group', () => {
        const g = new Group();
        g.transform = scaling(2, 2, 2);
        const s = new Sphere();
        s.transform = translation(5, 0, 0);
        g.add(s);

        const xs = g.intersects(ray(point(10, 0, -10), vector(0, 0, 1)));

        expect(xs.length).toBe(2);
    });

    test('finding normal on a child object', () => {
        const g1 = new Group();
        g1.transform = rotationY(Math.PI / 2);
        const g2 = new Group();
        g2.transform = scaling(1, 2, 3);
        const s = new Sphere();
        s.transform = translation(5, 0, 0);
        g1.add(g2);
        g2.add(s);

        const n = s.normalAt(point(1.7321, 1.1547, -5.5774));

        expect(tuplesAreEqual(n, vector(0.2857, 0.42854, -0.85716))).toBe(true);
    });

    test('the bounds of a group contains all children bounds', () => {
        const s = new Sphere();
        const c = new Cylinder();
        c.minimum = -5;
        c.maximum = 5;

        const g = new Group();
        g.add(s);
        g.add(c);

        const [min, max] = g.bounds();

        expect(min).toEqual(point(-1, -5, -1));
        expect(max).toEqual(point(1, 5, 1));
    });

    test('the bounds of a group is affected by children transformations', () => {
        const s1 = new Sphere();
        s1.transform = scaling(2, 2, 2);
        const s2 = new Sphere();
        s2.transform = translation(5, 0, 0);

        const g = new Group();
        g.add(s1);
        g.add(s2);

        const [min, max] = g.bounds();

        expect(min).toEqual(point(-2, -2, -2));
        expect(max).toEqual(point(6, 2, 2));
    });

    test('dividing a group partitions its children', () => {
        const s1 = new Sphere();
        s1.transform = translation(-2, -2, 0);
        const s2 = new Sphere();
        s2.transform = translation(-2, 2, 0);
        const s3 = new Sphere();
        s3.transform = scaling(4, 4, 4);

        const g = new Group();
        g.add(s1);
        g.add(s2);
        g.add(s3);
        g.divide(1);

        expect(g.shapes.length).toBe(2);
        expect(g.shapes[0].transform).toEqual(s3.transform);

        const subgroup = g.shapes[1] as Group;
        expect(subgroup.shapes.length).toBe(2);
        expect((subgroup.shapes[0] as Group).shapes[0].transform).toEqual(
            s1.transform
        );
        expect((subgroup.shapes[1] as Group).shapes[0].transform).toEqual(
            s2.transform
        );
    });
});
