struct TraceResult {
  terminate: bool,
  color: vec3<f32>,
  refractive_index: f32,
  reflect_ray: Ray,
  refract_ray: Ray,
  reflect_blend_factor: f32,
  refract_blend_factor: f32,
}

fn shade_pixel(x: f32, y: f32) -> vec3f {
  return shade_ray(ray_for_pixel(x, y));
}

fn shade_ray(primary_ray: Ray) -> vec3f {
  var color = vec3<f32>(0.0, 0.0, 0.0);
  let max_depth = clamp(camera.max_depth + 1, 1, 6); // TODO: change definition of max_depth to include the first ray in TS
  let trace_results_len = u32(pow(2.0, f32(max_depth)));
  var trace_results = array<TraceResult, 128>();
  trace_results[0] = TraceResult(true, vec3<f32>(0.0, 0.0, 0.0), 1.0, primary_ray, Ray(vec3f(), vec3f()), 1.0, 0.0);

  for(var i = 0u; i < max_depth; i++) {
    var all_terminated = true;
    var trace_path_count = u32(pow(2.0, f32(i)));

    for(var j = 0u; j < trace_path_count; j++) {
      var reflect_result: TraceResult = TraceResult(true, vec3<f32>(0.0, 0.0, 0.0), 1.0, Ray(vec3f(), vec3f()), Ray(vec3f(), vec3f()), 0.0, 0.0);
      var refract_result: TraceResult = TraceResult(true, vec3<f32>(0.0, 0.0, 0.0), 1.0, Ray(vec3f(), vec3f()), Ray(vec3f(), vec3f()), 0.0, 0.0);

      if(trace_results[j].reflect_blend_factor > 0.0) {
        reflect_result = trace(
          trace_results[j].reflect_ray,
          trace_results[j].color,
          trace_results[j].reflect_blend_factor,
          trace_results[j].refractive_index);
      }
      if(trace_results[j].refract_blend_factor > 0.0) {
        refract_result = trace(
          trace_results[j].refract_ray,
          trace_results[j].color,
          trace_results[j].refract_blend_factor,
          trace_results[j].refractive_index);
      }
      color += reflect_result.color + refract_result.color;

      trace_results[j] = reflect_result;
      trace_results[j+trace_path_count] = refract_result;

      if(!reflect_result.terminate || !refract_result.terminate) {
        all_terminated = false;
      }
    }

    if(all_terminated == true) {
      break;
    }
  }
  return color;
}

fn ray_for_pixel(x: f32, y: f32) -> Ray {
  let xoffset = (x + 0.5) * camera.pixel_size;
  let yoffset = (y + 0.5) * camera.pixel_size;

  let world_x = camera.half_width - xoffset;
  let world_y = camera.half_height - yoffset;

  // let pixel = (camera.inv_transform * vec4<f32>(world_x, world_y, -camera.focal_distance, 1.0)).xyz;
  let pixel = (camera.inv_transform * vec4<f32>(world_x, world_y, -1.0, 1.0)).xyz;
  let direction = normalize(pixel.xyz - camera.origin.xyz);

  return Ray(camera.origin, direction);
}

fn ray_for_pixel_jittered(x: f32, y: f32, jx: f32, jy: f32) -> Ray {
  let xoffset = (x + jx) * camera.pixel_size;
  let yoffset = (y + jy) * camera.pixel_size;
  let world_x = camera.half_width - xoffset;
  let world_y = camera.half_height - yoffset;
  let pixel = (camera.inv_transform * vec4<f32>(world_x, world_y, -1.0, 1.0)).xyz;
  let direction = normalize(pixel.xyz - camera.origin.xyz);
  return Ray(camera.origin, direction);
}

fn trace(ray: Ray, color: vec3f, blend_factor: f32, refractive_index: f32) -> TraceResult {
  var result: TraceResult = TraceResult(true, vec3<f32>(0.0, 0.0, 0.0), 1.0, ray, Ray(vec3f(), vec3f()), 0.0, 0.0);
  let hit = hit(ray);
  if(hit.distance <= 0.0) {
    return result;
  }
  // return abs(hit.point)*0.2; // Debug intersection positions
  var normal = normal_at(hit);
  // return abs(normal); // Debug surface normals
  let eye_v = -ray.direction;

  var material_idx = 0u;
  if(hit.buffer_type == OBJECT_BUFFER_TYPE_SHAPE) {
    material_idx = shapes[hit.buffer_index].material_idx;
  } else if(hit.buffer_type == OBJECT_BUFFER_TYPE_PRIMITIVE) {
    material_idx = primitives[hit.buffer_index].material_idx;
  } else if(hit.buffer_type == OBJECT_BUFFER_TYPE_TRIANGLE) {
    material_idx = triangles[hit.buffer_index].material_idx;
  }
  let material = materials[material_idx];

  var n_ratio = refractive_index / material.refractive_index;
  if(dot(normal, eye_v) < 0.0) {
    normal = -normal;
    result.refractive_index = material.refractive_index;
    n_ratio = material.refractive_index / refractive_index;
  }

  let light_count = 5u; // arrayLength(&lights);
  for(var i = 0u; i < light_count; i++) {
    let c = lights[i].color;
    if(c.r + c.g + c.b < 0.01) {
      break;
    }
    result.color += lightning(ray, hit, material_idx, normal, eye_v, c, lights[i].position) * blend_factor;
  }
  
  var r = 1.0;
  if(material.reflective > 0.0 && material.transparency > 0.0) {
    r = reflectance(eye_v, normal, n_ratio);
  }
  if(material.reflective > 0.0) {
    result.reflect_ray = Ray(hit.point + normal * SURFACE_EPSILON, reflect(ray.direction, normal));
    result.reflect_blend_factor = material.reflective * blend_factor;

    if(material.transparency > 0.0) {
      result.reflect_blend_factor *= r;
    }

    result.terminate = false;
  }
  if(material.transparency > 0.0) {
    result.refract_ray = Ray(hit.point - normal * SURFACE_EPSILON, refracted_direction(eye_v, normal, n_ratio));

    if(result.refract_ray.direction.x == 0.0 && result.refract_ray.direction.y == 0.0 && result.refract_ray.direction.z == 0.0) {
      result.refract_blend_factor = 0.0;
      return result;
    }

    result.refract_blend_factor = material.transparency * blend_factor;

    if(material.reflective > 0.0) {
      result.refract_blend_factor *= (1.0 - r);
    }

    result.terminate = false;
  }
  return result;
}

fn lightning(ray: Ray, hit: HitInfo, material_idx: u32, normal: vec3f, eye_v: vec3f, light_color: vec3f, light_pos: vec3f) -> vec3<f32> {
  let material = materials[material_idx];
  let effective_color = material_color_at(hit, material_idx) * light_color;
  let ambient = effective_color * material.ambient;

  if(is_shadowed(hit.point + normal * SURFACE_EPSILON, light_pos)) {
    return ambient;
  }

  let light_v = normalize(light_pos - hit.point);
  let light_dot_normal = dot(light_v, normal);

  if(light_dot_normal < 0.0) {
    return ambient;
  }

  let diffuse = effective_color * (material.diffuse * light_dot_normal);

  let reflect_dot_eye = dot(reflect(-light_v, normal), eye_v);
  if(reflect_dot_eye <= 0.0) {
    return ambient + diffuse;
  }

  let specular = (light_color * material.specular) * pow(reflect_dot_eye, material.shininess);
  return ambient + diffuse + specular;
}

fn is_shadowed(point: vec3<f32>, light: vec3<f32>) -> bool {
  let v = light - point;
  let distance = length(v);
  let direction = normalize(v);

  let r = Ray(point, direction);
  let hit = hit(r);
  if(hit.distance > 0.0 && hit.distance < distance) {
    return true;
  }
  return false;
}

fn refracted_direction(eyev: vec3f, normal: vec3f, n_ratio: f32) -> vec3f {
  let cos_i = dot(eyev, normal);
  let sin2_t = n_ratio * n_ratio * (1.0 - cos_i * cos_i);
  if(sin2_t > 1.0) {
    return vec3<f32>(0.0, 0.0, 0.0);
  }
  let cos_t = sqrt(1.0 - sin2_t);
  return normal * (n_ratio * cos_i - cos_t) - eyev * n_ratio;
}

fn reflectance(eyev: vec3f, normal: vec3f, n_ratio: f32) -> f32 {
  var cos = dot(eyev, normal);

  if(n_ratio > 1) {
    let sin2_t = n_ratio * n_ratio * (1.0 - cos * cos);
    if(sin2_t > 1.0) {
      return 1.0;
    }
    cos = sqrt(1.0 - sin2_t);
  }
  let r = (1.0 - n_ratio) / (1.0 + n_ratio);
  let r0 = r * r;
  return r0 + (1.0 - r0) * pow(1.0 - cos, 5.0);
}