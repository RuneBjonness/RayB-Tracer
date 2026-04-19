import { describe, expect, test } from 'vitest';
import { AreaLight, PointLight } from './lights';
import {
  radians,
  rotationX,
  rotationZ,
  translation,
} from '../math/transformations';
import { Color } from '../math/color';
import { point } from '../math/vector4';
import { defaultWorld } from '../../test/test-world';

describe('point-light', () => {
  test('a point light has a single sample position and intensity', () => {
    const position = point(0, 0, 0);
    const intensity = new Color(1, 1, 1);

    const light = new PointLight(position, intensity);

    expect(light.samplePoints()[0].equals(position)).toBe(true);
    expect(light.intensity.equals(intensity)).toBe(true);
  });

  test.each`
    p                       | result
    ${point(0, 1.0001, 0)}  | ${1.0}
    ${point(-1.0001, 0, 0)} | ${1.0}
    ${point(0, 0, -1.0001)} | ${1.0}
    ${point(0, 0, 1.0001)}  | ${0.0}
    ${point(1.0001, 0, 0)}  | ${0.0}
    ${point(0, -1.0001, 0)} | ${0.0}
    ${point(0, 0, 0)}       | ${0.0}
  `(
    'Point lights evaluate the light intensity at a given point',
    ({ p, result }) => {
      const w = defaultWorld();

      expect(w.lights[0].intensityAt(p, w)).toBeCloseTo(result);
    }
  );
});

describe('area-light', () => {
  test('an area light with no transformation spans from (-1,y,-1) to (1,y,1) where y is close to 0', () => {
    const intensity = new Color(1, 1, 1);

    const light = new AreaLight(intensity, 50, 1, []);
    const samples = light.samplePoints();

    const minXpos = Math.min(...samples.map((s) => s.x));
    const maxXpos = Math.max(...samples.map((s) => s.x));
    const minZpos = Math.min(...samples.map((s) => s.z));
    const maxZpos = Math.max(...samples.map((s) => s.z));

    expect(minXpos).toBeGreaterThanOrEqual(-1);
    expect(minXpos).toBeLessThanOrEqual(-0.5);
    expect(maxXpos).toBeGreaterThanOrEqual(0.5);
    expect(maxXpos).toBeLessThanOrEqual(1);

    expect(minZpos).toBeGreaterThanOrEqual(-1);
    expect(minZpos).toBeLessThanOrEqual(-0.5);
    expect(maxZpos).toBeGreaterThanOrEqual(0.5);
    expect(maxZpos).toBeLessThanOrEqual(1);

    expect(samples.every((s) => s.y < 0.01 && s.y > -0.01)).toBe(true);
    expect(light.intensity.equals(intensity)).toBe(true);
  });

  test('an area light can be transformed', () => {
    const light = new AreaLight(new Color(1, 1, 1), 50, 1, []);
    light.transform = translation(-5, 0, 0).multiply(rotationZ(radians(90)));

    const samples = light.samplePoints();

    const minYpos = Math.min(...samples.map((s) => s.y));
    const maxYpos = Math.max(...samples.map((s) => s.y));
    const minZpos = Math.min(...samples.map((s) => s.z));
    const maxZpos = Math.max(...samples.map((s) => s.z));

    expect(minYpos).toBeGreaterThanOrEqual(-1);
    expect(minYpos).toBeLessThanOrEqual(-0.5);
    expect(maxYpos).toBeGreaterThanOrEqual(0.5);
    expect(maxYpos).toBeLessThanOrEqual(1);

    expect(minZpos).toBeGreaterThanOrEqual(-1);
    expect(minZpos).toBeLessThanOrEqual(-0.5);
    expect(maxZpos).toBeGreaterThanOrEqual(0.5);
    expect(maxZpos).toBeLessThanOrEqual(1);

    expect(samples.every((s) => s.x < -4.99 && s.x > -5.01)).toBe(true);
  });

  test('an area light has a single intensity', () => {
    const intensity = new Color(1, 1, 1);
    const light = new AreaLight(intensity, 1, 1, []);

    expect(light.intensity.equals(intensity)).toBe(true);
  });

  test.each`
    p                       | result
    ${point(0, 1.0001, 0)}  | ${1.0}
    ${point(-1.0001, 0, 0)} | ${1.0}
    ${point(0, 0, -1.0001)} | ${1.0}
    ${point(0, 0, 1.0001)}  | ${0.0}
    ${point(1.0001, 0, 0)}  | ${0.0}
    ${point(0, -1.0001, 0)} | ${0.0}
    ${point(0, 0, 0)}       | ${0.0}
  `(
    'Area lights with maxSamples=1 evaluate the light intensity at a given point as if it were a point light placed in its center',
    ({ p, result }) => {
      const l = new AreaLight(new Color(1, 1, 1), 1, 1, []);
      l.transform = translation(-10.5, 9.5, -10);
      const w = defaultWorld();
      w.lights[0] = l;

      expect(w.lights[0].intensityAt(p, w)).toBeCloseTo(result);
    }
  );

  test.each`
    p                       | result
    ${point(0, 0, 2)}       | ${0.0}
    ${point(1, -1, 3)}      | ${0.2}
    ${point(1.5, 0, 2)}     | ${0.4}
    ${point(1.25, 1.25, 3)} | ${0.6}
    ${point(0, 0, -2)}      | ${1.0}
  `(
    'Area lights evaluate the average light intensity at a given point based on an evenly distributed collection of samples',
    ({ p, result }) => {
      const l = new AreaLight(new Color(1, 1, 1), 5, 1, []);
      l.transform = translation(-0.5, 0, -5).multiply(rotationX(radians(90)));
      const w = defaultWorld();
      w.lights[0] = l;

      // To be able to test, make random() be less random..
      Math.random = () => 0.5;

      expect(w.lights[0].intensityAt(p, w)).toBeCloseTo(result);
    }
  );
});

