import { hitSorted, Intersection } from '../intersections-buffer-objects';
import {
  BufferBackedLight,
  bufferBackedLightArray,
} from '../lights/buffer-backed-light';
import {
  BufferBackedMaterial,
  lighting,
} from '../material/buffer-backed-material';
import { Color } from '../math/color';
import { Vector4 } from '../math/vector4';
import { Ray } from '../rays';
import { BufferBackedBvhNode } from '../shapes/buffer-backed-objects/buffer-backed-bvh-node';
import { EPSILON } from '../shapes/buffer-backed-objects/buffer-backed-objects';
import { BufferBackedPrimitive } from '../shapes/buffer-backed-objects/buffer-backed-primitive';
import { BufferBackedShape } from '../shapes/buffer-backed-objects/buffer-backed-shape';
import { BufferBackedTriangle } from '../shapes/buffer-backed-objects/buffer-backed-triangle';
import { ObjectBuffers, ObjectBufferType } from '../shapes/object-buffers';
import { ShapeType } from '../shapes/shape';

type ContainerIdentity = {
  bufferIndex: number;
  bufferType: ObjectBufferType;
  materialIndex: number;
};

export class BufferBackedWorld {
  lights: BufferBackedLight[];
  shape: BufferBackedShape;
  primitive: BufferBackedPrimitive;
  triangle: BufferBackedTriangle;
  bvhNode: BufferBackedBvhNode;
  material: BufferBackedMaterial;

  constructor(
    lightsBuffer: ArrayBufferLike,
    objectsBuffer: ObjectBuffers,
    materialsBuffer: ArrayBufferLike,
    patternsBuffer: ArrayBufferLike,
    texturesBuffer: ArrayBufferLike
  ) {
    this.lights = bufferBackedLightArray(lightsBuffer);

    this.shape = new BufferBackedShape(objectsBuffer.shapesArrayBuffer);
    this.primitive = new BufferBackedPrimitive(
      objectsBuffer.primitivesArrayBuffer
    );
    this.triangle = new BufferBackedTriangle(
      objectsBuffer.trianglesArrayBuffer
    );
    this.bvhNode = new BufferBackedBvhNode(objectsBuffer.bvhArrayBuffer);

    this.material = new BufferBackedMaterial(materialsBuffer, patternsBuffer);

    if (texturesBuffer.byteLength > 16) {
      console.log('Textures not implemented');
    }
  }

  colorAt(r: Ray, maxDepth: number = 4): Color {
    const color = new Color(0, 0, 0);

    const intersections = this.intersects(r);
    const hit = hitSorted(intersections);

    if (hit === null || this.lights.length === 0) {
      return color;
    }

    const point = r.position(hit.time);
    const eyev = r.direction.clone().negate();
    const normalv = this.normalAt(point, hit);

    if (normalv.dot(eyev) < 0) {
      normalv.negate();
    }
    const adjustv = normalv.clone().scale(EPSILON);
    const overPoint = point.clone().add(adjustv);

    this.material.listIndex = hit.materialIndex;
    for (let i = 0; i < this.lights.length; i++) {
      const l = this.lights[i];
      color.add(
        lighting(
          this.material,
          l,
          point,
          eyev,
          normalv,
          l.intensityAt(overPoint, this)
        )
      );
    }

    if (maxDepth <= 0) {
      return color;
    }

    this.material.listIndex = hit.materialIndex;
    const reflective = this.material.reflective;
    const transparency = this.material.transparency;

    if (reflective === 0 && transparency === 0) {
      return color;
    }

    let reflected = new Color(0, 0, 0);
    if (reflective > 0) {
      const reflectv = r.direction.clone().reflect(normalv);
      reflected = this.colorAt(
        new Ray(overPoint, reflectv),
        maxDepth - 1
      ).multiplyByScalar(reflective);

      if (transparency === 0) {
        return color.add(reflected);
      }
    }

    let n1 = 1;
    let n2 = 1;
    const containers: ContainerIdentity[] = [];
    for (const inter of intersections) {
      if (inter.time === hit.time) {
        if (containers.length > 0) {
          this.material.listIndex =
            containers[containers.length - 1].materialIndex;
          n1 = this.material.refractiveIndex;
        }
      }

      const containerIdx = containers.findIndex(
        (c) =>
          c.bufferIndex === inter.bufferIndex &&
          c.bufferType === inter.bufferType
      );
      if (containerIdx >= 0) {
        containers.splice(containerIdx, 1);
      } else {
        containers.push({
          bufferIndex: inter.bufferIndex,
          bufferType: inter.bufferType,
          materialIndex: inter.materialIndex,
        });
      }

      if (inter.time === hit.time) {
        if (containers.length > 0) {
          this.material.listIndex =
            containers[containers.length - 1].materialIndex;
          n2 = this.material.refractiveIndex;
        }
        break;
      }
    }

    let refracted = new Color(0, 0, 0);
    const nRatio = n1 / n2;
    let cosI = eyev.dot(normalv);
    const sin2T = nRatio * nRatio * (1.0 - cosI * cosI);

    if (sin2T <= 1) {
      const cosT = Math.sqrt(1 - sin2T);
      const dir = normalv
        .clone()
        .scale(nRatio * cosI - cosT)
        .subtract(eyev.clone().scale(nRatio));

      refracted = this.colorAt(
        new Ray(point.clone().subtract(adjustv), dir),
        maxDepth - 1
      );
      refracted.multiplyByScalar(transparency);
    }

    if (reflective > 0 && transparency > 0) {
      if (n1 > n2) {
        if (sin2T > 1) {
          return color.add(reflected);
        }
        cosI = Math.sqrt(1.0 - sin2T);
      }
      const r0 = ((n1 - n2) / (n1 + n2)) ** 2;
      const reflectance = r0 + (1 - r0) * (1 - cosI) ** 5;

      reflected.multiplyByScalar(reflectance);
      refracted.multiplyByScalar(1 - reflectance);
    }

    return color.add(reflected).add(refracted);
  }

  intersects(r: Ray): Intersection[] {
    const intersections: Intersection[] = [];
    let shapeIndex = 1;
    let parentIndex = 0;
    let parentSpaceRay = r.clone();

    let nodeIndex = 0;
    let lastBvhApprovedShapeIndex = 0;

    while (shapeIndex < this.shape.listLength) {
      if (parentIndex > 0) {
        this.shape.listIndex = parentIndex;
        let lastChildIndex = this.shape.childIdxEnd;

        if (this.shape.shapeType === ShapeType.GroupBvh) {
          this.bvhNode.listIndex = lastChildIndex;
          lastChildIndex = this.bvhNode.childIdxEnd;
        }

        if (shapeIndex > lastChildIndex) {
          parentSpaceRay.applyMatrixBuffer(this.shape.inverseTransform);
          parentIndex = this.shape.parentIdx;
        }
      }

      this.shape.listIndex = shapeIndex;
      let localRay = parentSpaceRay
        .clone()
        .applyMatrixBuffer(this.shape.inverseTransform);

      switch (this.shape.shapeType) {
        case ShapeType.Sphere:
        case ShapeType.Plane:
        case ShapeType.Cube:
        case ShapeType.Cylinder:
        case ShapeType.Cone:
          this.shape.intersects(localRay, intersections);
          break;
        case ShapeType.Csg:
        case ShapeType.Group:
          if (this.shape.intersectsBounds(localRay)) {
            parentIndex = shapeIndex;
            parentSpaceRay = localRay;
          } else {
            shapeIndex = this.shape.childIdxEnd;
          }
          break;
        case ShapeType.GroupBvh:
          if (this.shape.intersectsBounds(localRay)) {
            parentIndex = shapeIndex;
            parentSpaceRay = localRay;
            nodeIndex = this.shape.childIdxStart + 1;
          } else {
            this.bvhNode.listIndex = this.shape.childIdxEnd;
            if (this.bvhNode.childType === ObjectBufferType.Shape) {
              shapeIndex = this.bvhNode.childIdxEnd;
            }
          }
          break;
      }

      shapeIndex++;

      while (
        nodeIndex > 0 &&
        nodeIndex < this.bvhNode.listLength &&
        shapeIndex > lastBvhApprovedShapeIndex
      ) {
        this.bvhNode.listIndex = nodeIndex;
        if (this.bvhNode.intersectsBounds(parentSpaceRay)) {
          if (this.bvhNode.leaf) {
            if (this.bvhNode.childType === ObjectBufferType.Primitive) {
              for (
                let i = this.bvhNode.childIdxStart;
                i <= this.bvhNode.childIdxEnd;
                i++
              ) {
                this.primitive.listIndex = i;
                this.primitive.intersects(parentSpaceRay, intersections);
              }
            } else if (this.bvhNode.childType === ObjectBufferType.Triangle) {
              for (
                let i = this.bvhNode.childIdxStart;
                i <= this.bvhNode.childIdxEnd;
                i++
              ) {
                this.triangle.listIndex = i;
                this.triangle.intersects(parentSpaceRay, intersections);
              }
            } else if (this.bvhNode.childType === ObjectBufferType.Shape) {
              shapeIndex = this.bvhNode.childIdxStart;
              lastBvhApprovedShapeIndex = this.bvhNode.childIdxEnd;
            }
          }
          nodeIndex++;
        } else {
          if (this.bvhNode.leaf) {
            nodeIndex++;
            if (this.bvhNode.childType === ObjectBufferType.Shape) {
              shapeIndex = this.bvhNode.childIdxEnd + 1;
            }
          } else {
            nodeIndex = this.bvhNode.childIdxEnd + 1;
            if (this.bvhNode.childType === ObjectBufferType.Shape) {
              this.bvhNode.listIndex = this.bvhNode.childIdxEnd;
              shapeIndex = this.bvhNode.childIdxEnd + 1;
            }
          }
        }
      }
    }

    if (this.primitive.listLength > 1) {
      this.primitive.listIndex = 1;
      if (this.primitive.parentIdx === 0) {
        for (let i = 1; i < this.primitive.listLength; i++) {
          this.primitive.listIndex = i;
          this.primitive.intersects(parentSpaceRay, intersections);
        }
      }
    }

    return intersections.sort((a, b) => a.time - b.time);
  }

  hitsAny(r: Ray, maxDistance: number): boolean {
    let shapeIndex = 1;
    let parentIndex = 0;
    let parentSpaceRay = r.clone();

    let nodeIndex = 0;
    let lastBvhApprovedShapeIndex = 0;

    while (shapeIndex < this.shape.listLength) {
      if (parentIndex > 0) {
        this.shape.listIndex = parentIndex;
        let lastChildIndex = this.shape.childIdxEnd;

        if (this.shape.shapeType === ShapeType.GroupBvh) {
          this.bvhNode.listIndex = lastChildIndex;
          lastChildIndex = this.bvhNode.childIdxEnd;
        }

        if (shapeIndex > lastChildIndex) {
          parentSpaceRay.applyMatrixBuffer(this.shape.inverseTransform);
          parentIndex = this.shape.parentIdx;
        }
      }

      this.shape.listIndex = shapeIndex;
      let localRay = parentSpaceRay
        .clone()
        .applyMatrixBuffer(this.shape.inverseTransform);

      switch (this.shape.shapeType) {
        case ShapeType.Sphere:
        case ShapeType.Plane:
        case ShapeType.Cube:
        case ShapeType.Cylinder:
        case ShapeType.Cone:
          if (this.shape.hits(localRay, maxDistance)) {
            return true;
          }
          break;
        case ShapeType.Csg:
        case ShapeType.Group:
          if (this.shape.intersectsBounds(localRay)) {
            parentIndex = shapeIndex;
            parentSpaceRay = localRay;
          } else {
            shapeIndex = this.shape.childIdxEnd;
          }
          break;
        case ShapeType.GroupBvh:
          if (this.shape.intersectsBounds(localRay)) {
            parentIndex = shapeIndex;
            parentSpaceRay = localRay;
            nodeIndex = this.shape.childIdxStart + 1;
          } else {
            this.bvhNode.listIndex = this.shape.childIdxEnd;
            if (this.bvhNode.childType === ObjectBufferType.Shape) {
              shapeIndex = this.bvhNode.childIdxEnd;
            }
          }
          break;
      }

      shapeIndex++;

      while (
        nodeIndex > 0 &&
        nodeIndex < this.bvhNode.listLength &&
        shapeIndex > lastBvhApprovedShapeIndex
      ) {
        this.bvhNode.listIndex = nodeIndex;
        if (this.bvhNode.intersectsBounds(parentSpaceRay)) {
          if (this.bvhNode.leaf) {
            if (this.bvhNode.childType === ObjectBufferType.Primitive) {
              for (
                let i = this.bvhNode.childIdxStart;
                i <= this.bvhNode.childIdxEnd;
                i++
              ) {
                this.primitive.listIndex = i;
                if (this.primitive.hits(parentSpaceRay, maxDistance)) {
                  return true;
                }
              }
            } else if (this.bvhNode.childType === ObjectBufferType.Triangle) {
              for (
                let i = this.bvhNode.childIdxStart;
                i <= this.bvhNode.childIdxEnd;
                i++
              ) {
                this.triangle.listIndex = i;
                if (this.triangle.hits(parentSpaceRay, maxDistance)) {
                  return true;
                }
              }
            } else if (this.bvhNode.childType === ObjectBufferType.Shape) {
              shapeIndex = this.bvhNode.childIdxStart;
              lastBvhApprovedShapeIndex = this.bvhNode.childIdxEnd;
            }
          }
          nodeIndex++;
        } else {
          if (this.bvhNode.leaf) {
            nodeIndex++;
            if (this.bvhNode.childType === ObjectBufferType.Shape) {
              shapeIndex = this.bvhNode.childIdxEnd + 1;
            }
          } else {
            nodeIndex = this.bvhNode.childIdxEnd + 1;
            if (this.bvhNode.childType === ObjectBufferType.Shape) {
              this.bvhNode.listIndex = this.bvhNode.childIdxEnd;
              shapeIndex = this.bvhNode.childIdxEnd + 1;
            }
          }
        }
      }
    }

    if (this.primitive.listLength > 1) {
      this.primitive.listIndex = 1;
      if (this.primitive.parentIdx === 0) {
        for (let i = 1; i < this.primitive.listLength; i++) {
          this.primitive.listIndex = i;
          if (this.primitive.hits(parentSpaceRay, maxDistance)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  normalAt(p: Vector4, i: Intersection): Vector4 {
    let localNormal: Vector4;
    let idx = i.bufferIndex;

    if (i.bufferType === ObjectBufferType.Primitive) {
      this.primitive.listIndex = i.bufferIndex;
      localNormal = this.primitive.normalAt(p);
      idx = this.primitive.parentIdx;
    } else if (i.bufferType === ObjectBufferType.Triangle) {
      this.triangle.listIndex = i.bufferIndex;
      localNormal = this.triangle.normalAt(i);
      idx = this.triangle.parentIdx;
    } else {
      let localPoint = this.worldToObject(p, i);
      this.shape.listIndex = i.bufferIndex;
      localNormal = this.shape.normalAt(localPoint);
    }

    while (idx > 0) {
      this.shape.listIndex = idx;
      localNormal.applyMatrixBuffer(this.shape.inverseTransformTransposed);
      localNormal.w = 0;
      localNormal.normalize();
      idx = this.shape.parentIdx;
    }
    return localNormal;
  }

  worldToObject(p: Vector4, i: Intersection): Vector4 {
    this.shape.listIndex = i.bufferIndex;

    const matrices: Float32Array[] = [this.shape.inverseTransform];
    while (this.shape.parentIdx > 0) {
      this.shape.listIndex = this.shape.parentIdx;
      matrices.push(this.shape.inverseTransform);
    }

    let point = p.clone();
    for (let j = matrices.length - 1; j >= 0; j--) {
      point.applyMatrixBuffer(matrices[j]);
    }
    return point;
  }

  isShadowed(p: Vector4, lightPosition: Vector4): boolean {
    const v = lightPosition.clone().subtract(p);
    const distance = v.magnitude();
    const direction = v.scale(1 / distance);
    return this.hitsAny(new Ray(p, direction), distance);
  }
}
