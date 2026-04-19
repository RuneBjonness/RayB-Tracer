// PCG-hash based per-pixel RNG. Kept bit-identical with src/lib/math/rng.ts.
//
// Usage:
//   var state: u32;
//   state = reseed(x, y, pass, dim);
//   let u = next_float01(&state);
//
// The stream is keyed on (x, y, pass, dim). Each sampling dimension
// (pixel jitter, hemisphere bounce, future path-tracer dims) pulls from
// a decorrelated stream across passes.

fn pcg_hash(input: u32) -> u32 {
  let state = input * 747796405u + 2891336453u;
  let shift = ((state >> 28u) + 4u) & 31u;
  let word = ((state >> shift) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}

fn reseed(x: u32, y: u32, pass_idx: u32, dim: u32) -> u32 {
  var s: u32 = pcg_hash(x);
  s = pcg_hash(s ^ y);
  s = pcg_hash(s ^ pass_idx);
  s = pcg_hash(s ^ dim);
  return s;
}

fn next_u32(state: ptr<function, u32>) -> u32 {
  *state = pcg_hash(*state);
  return *state;
}

const INV_U32: f32 = 1.0 / 4294967296.0;

fn next_float01(state: ptr<function, u32>) -> f32 {
  return f32(next_u32(state)) * INV_U32;
}

// Duff et al. 2017, "Building an Orthonormal Basis, Revisited".
fn orthonormal_basis(n: vec3<f32>) -> mat2x3<f32> {
  let sign_z = select(-1.0, 1.0, n.z >= 0.0);
  let a = -1.0 / (sign_z + n.z);
  let b = n.x * n.y * a;
  let tangent = vec3<f32>(1.0 + sign_z * n.x * n.x * a, sign_z * b, -sign_z * n.x);
  let bitangent = vec3<f32>(b, sign_z + n.y * n.y * a, -n.y);
  return mat2x3<f32>(tangent, bitangent);
}

fn sample_hemisphere_cosine(u1: f32, u2: f32, normal: vec3<f32>) -> vec3<f32> {
  let r = sqrt(u1);
  let phi = 6.283185307179586 * u2;
  let x_local = r * cos(phi);
  let y_local = r * sin(phi);
  let z_local = sqrt(max(0.0, 1.0 - u1));

  let basis = orthonormal_basis(normal);
  let tangent = basis[0];
  let bitangent = basis[1];
  return tangent * x_local + bitangent * y_local + normal * z_local;
}
