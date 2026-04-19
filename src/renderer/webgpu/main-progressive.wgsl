const PI = 3.14159265;
const EPSILON = 0.001;
const SURFACE_EPSILON = 0.005;

struct Camera {
  origin: vec3<f32>,
  inv_transform: mat4x4<f32>,
  pixel_size: f32,
  half_width: f32,
  half_height: f32,
  aperture: f32,
  focal_distance: f32,
  max_depth: u32,
  width: u32,
}

struct Shape {
  shape_type: u32,
  min: f32,
  max: f32,
  closed: u32,

  material_idx: u32,
  parent_idx: u32,
  child_idx_start: u32,
  child_idx_end: u32,

  bound_min: vec3f,
  bound_max: vec3f,

  transform: mat4x4<f32>,
  inv_transform: mat4x4<f32>,
  inv_transform_transposed: mat4x4<f32>,
}

struct Primitive {
  center: vec3f,
  radius_squared: f32,
  shape_type: u32,
  material_idx: u32,
  parent_idx: u32,
}

struct Triangle {
  p1: vec3f,
  e1: vec3f,
  e2: vec3f,
  n1: vec3f,
  shape_type: u32,
  n2: vec3f,
  material_idx: u32,
  n3: vec3f,
  parent_idx: u32,
}

struct BvhNode {
  leaf: u32,
  child_type: u32,
  child_idx_start: u32,
  child_idx_end: u32,
  bound_min: vec3f,
  bound_max: vec3f,
}

struct Light {
  color: vec3f,
  position: vec3f,
  shape_idx: u32,
}

struct SampleInfo {
  pass_index: u32,
  sample_count: u32,
}

const SHAPE_SPHERE = 1u;
const SHAPE_PLANE = 2u;
const SHAPE_CUBE = 3u;
const SHAPE_CYLINDER = 4u;
const SHAPE_CONE = 5u;
const SHAPE_TRIANGLE = 6u;
const SHAPE_SMOOTH_TRIANGLE = 7u;
const SHAPE_CSG = 8u;
const SHAPE_GROUP = 9u;
const SHAPE_GROUP_BVH = 10u;
const SHAPE_PRIMITIVE_SPHERE = 11u;

const OBJECT_BUFFER_TYPE_SHAPE = 0u;
const OBJECT_BUFFER_TYPE_PRIMITIVE = 1u;
const OBJECT_BUFFER_TYPE_TRIANGLE = 2u;
const OBJECT_BUFFER_TYPE_BVH_NODE = 3u;

@group(0) @binding(0)
var<uniform> camera: Camera;

@group(0) @binding(1)
var<storage, read> shapes: array<Shape>;

@group(0) @binding(2)
var<storage, read> primitives: array<Primitive>;

@group(0) @binding(3)
var<storage, read> triangles: array<Triangle>;

@group(0) @binding(4)
var<storage, read> bvh: array<BvhNode>;

@group(0) @binding(5)
var<uniform> lights: array<Light, 5>;

@group(0) @binding(6)
var<storage, read> materials: array<Material>;

@group(0) @binding(7)
var<storage, read> patterns: array<Pattern>;

@group(0) @binding(8)
var<storage, read> image_data: array<u32>;

@group(0) @binding(9)
var<storage, read_write> output: array<u32>;

@group(0) @binding(10)
var<storage, read_write> accumulator: array<vec4<f32>>;

@group(0) @binding(11)
var<uniform> sample_info: SampleInfo;

// Material index for a hit — mirrors the lookup inside `trace`.
fn material_idx_for_hit(h: HitInfo) -> u32 {
  if(h.buffer_type == OBJECT_BUFFER_TYPE_SHAPE) {
    return shapes[h.buffer_index].material_idx;
  } else if(h.buffer_type == OBJECT_BUFFER_TYPE_PRIMITIVE) {
    return primitives[h.buffer_index].material_idx;
  } else if(h.buffer_type == OBJECT_BUFFER_TYPE_TRIANGLE) {
    return triangles[h.buffer_index].material_idx;
  }
  return 0u;
}

// One Monte Carlo sample: full Whitted shading (direct lighting, reflections,
// refractions) for a jittered primary ray, plus one cosine-hemisphere indirect
// bounce weighted by the surface albedo. The indirect bounce itself is
// Whitted-shaded, mirroring the CPU `progressiveColorAt` path.
fn shade_pixel_progressive(x: f32, y: f32, state: ptr<function, u32>) -> vec3f {
  let jx = next_float01(state);
  let jy = next_float01(state);
  let primary = ray_for_pixel_jittered(x, y, jx, jy);

  var color = shade_ray(primary);

  let primary_hit = hit(primary);
  if(primary_hit.distance <= 0.0 || primary_hit.distance >= 1000000.0) {
    return color;
  }
  let material_idx = material_idx_for_hit(primary_hit);
  let m = materials[material_idx];
  if(m.diffuse <= 0.0) {
    return color;
  }

  var normal = normal_at(primary_hit);
  if(dot(normal, -primary.direction) < 0.0) {
    normal = -normal;
  }
  let u1 = next_float01(state);
  let u2 = next_float01(state);
  let bounce_dir = sample_hemisphere_cosine(u1, u2, normal);
  let bounce_origin = primary_hit.point + normal * SURFACE_EPSILON;
  let indirect = shade_ray(Ray(bounce_origin, bounce_dir));

  let albedo = material_color_at(primary_hit, material_idx) * m.diffuse;
  return color + albedo * indirect;
}

@compute @workgroup_size(8,8)
fn main(
  @builtin(global_invocation_id) global_id : vec3<u32>,
) {
  let pixel_count = arrayLength(&output);
  if(global_id.x >= camera.width || global_id.y * camera.width + global_id.x >= pixel_count) {
    return;
  }
  let pixel_idx = global_id.y * camera.width + global_id.x;

  var state: u32 = reseed(global_id.x, global_id.y, sample_info.pass_index, 0u);
  let sample = shade_pixel_progressive(f32(global_id.x), f32(global_id.y), &state);

  accumulator[pixel_idx] += vec4<f32>(sample, 1.0);

  let count = max(1.0, f32(sample_info.sample_count));
  var color = accumulator[pixel_idx].rgb / count;
  color = color / (1.0 + color);
  color = pow(max(color, vec3<f32>(0.0)), vec3<f32>(1.0 / 2.2));
  color = clamp(color, vec3<f32>(0.0), vec3<f32>(1.0));

  output[pixel_idx] = u32(color.r * 255.0) | (u32(color.g * 255.0) << 8) | (u32(color.b * 255.0) << 16) | (255u << 24);
}
