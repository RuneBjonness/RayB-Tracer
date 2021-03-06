import * as tuples from './tuples';
import * as matrices from './matrices';

test('constructing and inspecting a 4x4 matrix', () => {
    const m = [
        [1, 2, 3, 4],
        [5.5, 6.5, 7.5, 8.5],
        [9, 10, 11, 12],
        [13.5, 14.5, 15.5, 16.5],
    ];

    expect(m[0][0]).toBe(1);
    expect(m[0][3]).toBe(4);
    expect(m[1][0]).toBe(5.5);
    expect(m[1][2]).toBe(7.5);
    expect(m[2][2]).toBe(11);
    expect(m[3][0]).toBe(13.5);
    expect(m[3][2]).toBe(15.5);
});

test('constructing and inspecting a 3x3 matrix', () => {
    const m = [
        [-3, 5, 0],
        [1, -2, -7],
        [0, 1, 1],
    ];

    expect(m[0][0]).toBe(-3);
    expect(m[1][1]).toBe(-2);
    expect(m[2][2]).toBe(1);
});

test('constructing and inspecting a 2x2 matrix', () => {
    const m = [
        [-3, 5],
        [1, -2],
    ];

    expect(m[0][0]).toBe(-3);
    expect(m[0][1]).toBe(5);
    expect(m[1][0]).toBe(1);
    expect(m[1][1]).toBe(-2);
});

test('two matrices are equal if no values have a difference greater than 0.00001 ', () => {
    const m1 = [
        [1, 2, 3, 4],
        [5.5, 6.5, 7.5, 8.5],
        [9, 10, 11, 12],
        [13.5, 14.5, 15.5, 16.5],
    ];
    const m2 = [
        [1, 2, 3, 4],
        [5.5, 6.5, 7.5, 8.499999],
        [9, 10, 11, 12],
        [13.5, 14.5, 15.5, 16.5],
    ];

    expect(matrices.areEqual(m1, m2)).toBe(true);
});

test('two matrices are not equal if any value has a difference greater than 0.00001 ', () => {
    const m1 = [
        [1, 2, 3, 4],
        [5.5, 6.5, 7.5, 8.5],
        [9, 10, 11, 12],
        [13.5, 14.5, 15.5, 16.5],
    ];
    const m2 = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13.5, 14.5, 15.5, 16.5],
    ];

    expect(matrices.areEqual(m1, m2)).toBe(false);
});

test('multiplying two matrices', () => {
    const m1 = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 8, 7, 6],
        [5, 4, 3, 2],
    ];

    const m2 = [
        [-2, 1, 2, 3],
        [3, 2, 1, -1],
        [4, 3, 6, 5],
        [1, 2, 7, 8],
    ];
    const expected = [
        [20, 22, 50, 48],
        [44, 54, 114, 108],
        [40, 58, 110, 102],
        [16, 26, 46, 42],
    ];

    const result = matrices.multiply(m1, m2);

    expect(matrices.areEqual(expected, result)).toBe(true);
});

test('multiplying a matrix with a tuple', () => {
    const m = [
        [1, 2, 3, 4],
        [2, 4, 4, 2],
        [8, 6, 4, 1],
        [0, 0, 0, 1],
    ];
    const b = tuples.tuple(1, 2, 3, 1);

    const result = matrices.multiply(m, b);

    expect(tuples.areEqual(result, tuples.tuple(18, 24, 33, 1))).toBe(true);
});

test('multiplying a matrix by the identity matrix', () => {
    const m = [
        [0, 1, 2, 4],
        [1, 2, 4, 8],
        [2, 4, 8, 16],
        [4, 8, 16, 32],
    ];
    const result = matrices.multiply(m, matrices.identityMatrix());

    expect(matrices.areEqual(m, result)).toBe(true);
});

test('multiplying the identity matrix by a tuple', () => {
    const a = tuples.tuple(1, 2, 3, 4);

    const result = matrices.multiply(matrices.identityMatrix(), a);

    expect(tuples.areEqual(result, a)).toBe(true);
});

test('transposing a matrix', () => {
    const m = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 8, 7, 6],
        [5, 4, 3, 2],
    ];

    const expected = [
        [1, 5, 9, 5],
        [2, 6, 8, 4],
        [3, 7, 7, 3],
        [4, 8, 6, 2],
    ];

    const result = matrices.transpose(m);

    expect(matrices.areEqual(expected, result)).toBe(true);
});

test('transposing the identity matrix', () => {
    const result = matrices.transpose(matrices.identityMatrix());

    expect(matrices.areEqual(matrices.identityMatrix(), result)).toBe(true);
});

test('calculating the determinat of a 2x2 matrix', () => {
    const m = [
        [1, 5],
        [-3, 2],
    ];

    const d = matrices.determinant(m);

    expect(d).toBe(17);
});

test('a submatrix of a 3x3 matrix is a 2x2 matrix', () => {
    const m = [
        [1, 5, 0],
        [-3, 2, 7],
        [0, 6, -3],
    ];
    const expected = [
        [-3, 2],
        [0, 6],
    ];

    const submatrix = matrices.subMatrix(m, 0, 2);

    expect(matrices.areEqual(expected, submatrix)).toBe(true);
});

test('a submatrix of a 4x4 matrix is a 3x3 matrix', () => {
    const m = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 8, 7, 6],
        [5, 4, 3, 2],
    ];
    const expected = [
        [1, 3, 4],
        [5, 7, 8],
        [5, 3, 2],
    ];

    const submatrix = matrices.subMatrix(m, 2, 1);

    expect(matrices.areEqual(expected, submatrix)).toBe(true);
});

test('calculating a minor of a 3x3 matrix', () => {
    const a = [
        [3, 5, 0],
        [2, -1, -7],
        [6, -1, 5],
    ];
    const b = matrices.subMatrix(a, 1, 0);

    expect(matrices.determinant(b)).toBe(25);
    expect(matrices.minor(a, 1, 0)).toBe(25);
});

test('calculating a cofactor of a 3x3 matrix', () => {
    const a = [
        [3, 5, 0],
        [2, -1, -7],
        [6, -1, 5],
    ];

    expect(matrices.minor(a, 0, 0)).toBe(-12);
    expect(matrices.cofactor(a, 0, 0)).toBe(-12);

    expect(matrices.minor(a, 1, 0)).toBe(25);
    expect(matrices.cofactor(a, 1, 0)).toBe(-25);
});

test('calculating the determinant of a 3x3 matrix', () => {
    const m = [
        [1, 2, 6],
        [-5, 8, -4],
        [2, 6, 4],
    ];

    expect(matrices.cofactor(m, 0, 0)).toBe(56);
    expect(matrices.cofactor(m, 0, 1)).toBe(12);
    expect(matrices.cofactor(m, 0, 2)).toBe(-46);
    expect(matrices.determinant(m)).toBe(-196);
});

test('calculating the determinant of a 4x4 matrix', () => {
    const m = [
        [-2, -8, 3, 5],
        [-3, 1, 7, 3],
        [1, 2, -9, 6],
        [-6, 7, 7, -9],
    ];

    expect(matrices.cofactor(m, 0, 0)).toBe(690);
    expect(matrices.cofactor(m, 0, 1)).toBe(447);
    expect(matrices.cofactor(m, 0, 2)).toBe(210);
    expect(matrices.cofactor(m, 0, 3)).toBe(51);
    expect(matrices.determinant(m)).toBe(-4071);
});

test('testing an invertible matrix for invertibility', () => {
    const m = [
        [6, 4, 4, 4],
        [5, 5, 7, 6],
        [4, -9, 3, -7],
        [9, 1, 7, -6],
    ];

    expect(matrices.determinant(m)).toBe(-2120);
    expect(matrices.isInvertible(m)).toBe(true);
});

test('testing a noninvertible matrix for invertibility', () => {
    const m = [
        [-4, 2, -2, -3],
        [9, 6, 2, 6],
        [0, -5, 1, -5],
        [0, 0, 0, 0],
    ];

    expect(matrices.determinant(m)).toBe(0);
    expect(matrices.isInvertible(m)).toBe(false);
});

test('calculating the inverse of a matrix', () => {
    const m1 = [
        [-5, 2, 6, -8],
        [1, -5, 1, 8],
        [7, 7, -6, -7],
        [1, -3, 7, 4],
    ];

    const m2 = matrices.inverse(m1);

    const m1inverted = [
        [0.21805, 0.45113, 0.2406, -0.04511],
        [-0.80827, -1.45677, -0.44361, 0.52068],
        [-0.07895, -0.22368, -0.05263, 0.19737],
        [-0.52256, -0.81391, -0.30075, 0.30639],
    ];

    expect(matrices.determinant(m1)).toEqual(532);
    expect(matrices.cofactor(m1, 2, 3)).toEqual(-160);
    expect(m2[3][2]).toEqual(-160 / 532);

    expect(matrices.cofactor(m1, 3, 2)).toEqual(105);
    expect(m2[2][3]).toEqual(105 / 532);

    expect(matrices.areEqual(m1inverted, m2)).toBe(true);
});

test('calculating the inverse of another matrix', () => {
    const m1 = [
        [8, -5, 9, 2],
        [7, 5, 6, 1],
        [-6, 0, 9, 6],
        [-3, 0, -9, -4],
    ];
    const m1inverted = [
        [-0.15385, -0.15385, -0.28205, -0.53846],
        [-0.07692, 0.12308, 0.02564, 0.03077],
        [0.35897, 0.35897, 0.4359, 0.92308],
        [-0.69231, -0.69231, -0.76923, -1.92308],
    ];
    const m2 = matrices.inverse(m1);

    expect(matrices.areEqual(m1inverted, m2)).toBe(true);
});

test('calculating the inverse of yet another matrix', () => {
    const m1 = [
        [9, 3, 0, 9],
        [-5, -2, -6, -3],
        [-4, 9, 6, 4],
        [-7, 6, 6, 2],
    ];
    const m1inverted = [
        [-0.04074, -0.07778, 0.14444, -0.22222],
        [-0.07778, 0.03333, 0.36667, -0.33333],
        [-0.02901, -0.1463, -0.10926, 0.12963],
        [0.17778, 0.06667, -0.26667, 0.33333],
    ];
    const m2 = matrices.inverse(m1);

    expect(matrices.areEqual(m1inverted, m2)).toBe(true);
});

test('multiplying a product by its inverse', () => {
    const m1 = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 8, 7, 6],
        [5, 4, 3, 2],
    ];

    const m2 = [
        [-2, 1, 2, 3],
        [3, 2, 1, -1],
        [4, 3, 6, 5],
        [1, 2, 7, 8],
    ];

    const prod = matrices.multiply(m1, m2);
    const result = matrices.multiply(prod, matrices.inverse(m2));

    expect(matrices.areEqual(m1, result)).toBe(true);
});
