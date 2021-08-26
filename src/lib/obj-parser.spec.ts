import { ObjParser } from './obj-parser';
import { Triangle } from './shapes';
import { point } from './tuples';

test('ignoring unrecognized lines', () => {
    const parser = new ObjParser();
    parser.parse("gibberish gibberish gibberish\nmore gibberish\neven more gibberish");

    expect(parser.ignoredLines).toBe(3);
});

test('parsing vertex records', () => {
    const objData = 
`v -1 1 0
v -1.0000 0.5000 0.0000
v 1 0 0
v 1 1 0`;

    const parser = new ObjParser();
    parser.parse(objData);

    expect(parser.vertices[0]).toEqual(point(-1, 1, 0));
    expect(parser.vertices[1]).toEqual(point(-1, 0.5, 0));
    expect(parser.vertices[2]).toEqual(point(1, 0, 0));
    expect(parser.vertices[3]).toEqual(point(1, 1, 0));
});

test('parsing triangle faces', () => {
    const objData = 
`v -1 1 0
v -1 0 0
v 1 0 0
v 1 1 0

f 1 2 3
f 1 3 4`;

    const parser = new ObjParser();
    parser.parse(objData);

    const t1 = parser.model.shapes[0] as Triangle;
    const t2 = parser.model.shapes[1] as Triangle;

    expect(t1.p1).toEqual(parser.vertices[0]);
    expect(t1.p2).toEqual(parser.vertices[1]);
    expect(t1.p3).toEqual(parser.vertices[2]);

    expect(t2.p1).toEqual(parser.vertices[0]);
    expect(t2.p2).toEqual(parser.vertices[2]);
    expect(t2.p3).toEqual(parser.vertices[3]);
});
