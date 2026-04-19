import { Scene, SceneMode } from '../../scenes/scene';
import { ScenePreset, loadScene } from '../../scenes/scene-preset';
import { RenderConfiguration } from '../configuration';
import rngWgsl from './rng.wgsl?raw';
import mainProgressiveWgsl from './main-progressive.wgsl?raw';
import intersectionsWgsl from './intersections.wgsl?raw';
import previewRendererWgsl from './preview-renderer.wgsl?raw';
import materialsWgsl from './materials.wgsl?raw';
import { MatrixOrder } from '../../lib/math/matrices';
import useRayTracerStore from '../../store';

let currentDriverToken = 0;

const storageEntry = (binding: number): GPUBindGroupLayoutEntry => ({
  binding,
  visibility: GPUShaderStage.COMPUTE,
  buffer: { type: 'read-only-storage' },
});
const uniformEntry = (binding: number): GPUBindGroupLayoutEntry => ({
  binding,
  visibility: GPUShaderStage.COMPUTE,
  buffer: { type: 'uniform' },
});
const rwStorageEntry = (binding: number): GPUBindGroupLayoutEntry => ({
  binding,
  visibility: GPUShaderStage.COMPUTE,
  buffer: { type: 'storage' },
});

const renderProgressiveGpu = async (
  ctx: CanvasRenderingContext2D,
  cfg: RenderConfiguration,
  sceneMode: SceneMode,
  sceneDefinition: ScenePreset | string | null,
  _onProgress: (units: number) => void
) => {
  if (sceneDefinition == null) return;
  if (!navigator.gpu) throw new Error('WebGPU not supported.');

  const myToken = ++currentDriverToken;
  const isSuperseded = () => myToken !== currentDriverToken;

  const scene: Scene =
    sceneMode === 'scenePreset'
      ? await loadScene(sceneDefinition as ScenePreset, cfg)
      : new Scene(JSON.parse(sceneDefinition as string), cfg);

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error('No appropriate GPUAdapter found.');

  const REQUIRED_STORAGE_BUFFERS = 9;
  if (
    adapter.limits.maxStorageBuffersPerShaderStage < REQUIRED_STORAGE_BUFFERS
  ) {
    throw new Error(
      `GPUAdapter supports only ${adapter.limits.maxStorageBuffersPerShaderStage} storage buffers per compute stage; progressive renderer needs ${REQUIRED_STORAGE_BUFFERS}.`
    );
  }
  const requiredLimits: Record<string, number> = {
    maxStorageBuffersPerShaderStage: REQUIRED_STORAGE_BUFFERS,
  };
  if (scene.name === 'MarbleMadness_100_BVH') {
    if (adapter.limits.maxStorageBufferBindingSize < 512 * 1024 * 1024) {
      throw new Error(
        `GPUAdapter does not support 512MB storage buffers. Max: ${adapter.limits.maxStorageBufferBindingSize}`
      );
    }
    requiredLimits.maxStorageBufferBindingSize = 512 * 1024 * 1024;
  }
  const device = await adapter.requestDevice({ requiredLimits });

  const module = device.createShaderModule({
    code:
      rngWgsl +
      mainProgressiveWgsl +
      intersectionsWgsl +
      previewRendererWgsl +
      materialsWgsl,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      uniformEntry(0),
      storageEntry(1),
      storageEntry(2),
      storageEntry(3),
      storageEntry(4),
      uniformEntry(5),
      storageEntry(6),
      storageEntry(7),
      storageEntry(8),
      rwStorageEntry(9),
      rwStorageEntry(10),
      uniformEntry(11),
    ],
  });

  const pipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    }),
    compute: { module, entryPoint: 'main' },
  });

  const buffers = scene.toArrayBuffers(false, MatrixOrder.ColumnMajor);

  const makeBuf = (
    label: string,
    data: ArrayBufferLike,
    usage: GPUBufferUsageFlags
  ) => {
    const b = device.createBuffer({
      label,
      size: Math.max(16, Math.ceil(data.byteLength / 16) * 16),
      usage: usage | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(b, 0, data);
    return b;
  };

  const cameraBuf = makeBuf('camera', buffers.camera, GPUBufferUsage.UNIFORM);
  const shapesBuf = makeBuf(
    'shapes',
    buffers.objects.shapesArrayBuffer,
    GPUBufferUsage.STORAGE
  );
  const primitivesBuf = makeBuf(
    'primitives',
    buffers.objects.primitivesArrayBuffer,
    GPUBufferUsage.STORAGE
  );
  const trianglesBuf = makeBuf(
    'triangles',
    buffers.objects.trianglesArrayBuffer,
    GPUBufferUsage.STORAGE
  );
  const bvhBuf = makeBuf(
    'bvh',
    buffers.objects.bvhArrayBuffer,
    GPUBufferUsage.STORAGE
  );
  const lightsBuf = makeBuf('lights', buffers.lights, GPUBufferUsage.UNIFORM);
  const materialsBuf = makeBuf(
    'materials',
    buffers.materials,
    GPUBufferUsage.STORAGE
  );
  const patternsBuf = makeBuf(
    'patterns',
    buffers.patterns,
    GPUBufferUsage.STORAGE
  );
  const imageDataBuf = makeBuf(
    'image-data',
    buffers.imageData,
    GPUBufferUsage.STORAGE
  );

  const OUTPUT_BYTES = cfg.width * cfg.height * 4;
  const outputBuf = device.createBuffer({
    label: 'output',
    size: OUTPUT_BYTES,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  const ACC_BYTES = cfg.width * cfg.height * 4 * 4; // vec4<f32>
  const accumulatorBuf = device.createBuffer({
    label: 'accumulator',
    size: ACC_BYTES,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(accumulatorBuf, 0, new Float32Array(ACC_BYTES / 4));

  const sampleInfoBuf = device.createBuffer({
    label: 'sample-info',
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const stagingBuf = device.createBuffer({
    label: 'staging',
    size: OUTPUT_BYTES,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: cameraBuf } },
      { binding: 1, resource: { buffer: shapesBuf } },
      { binding: 2, resource: { buffer: primitivesBuf } },
      { binding: 3, resource: { buffer: trianglesBuf } },
      { binding: 4, resource: { buffer: bvhBuf } },
      { binding: 5, resource: { buffer: lightsBuf } },
      { binding: 6, resource: { buffer: materialsBuf } },
      { binding: 7, resource: { buffer: patternsBuf } },
      { binding: 8, resource: { buffer: imageDataBuf } },
      { binding: 9, resource: { buffer: outputBuf } },
      { binding: 10, resource: { buffer: accumulatorBuf } },
      { binding: 11, resource: { buffer: sampleInfoBuf } },
    ],
  });

  const store = useRayTracerStore;
  const targetPasses =
    cfg.iterations > 0 ? cfg.iterations : store.getState().targetPasses;
  store.getState().startRender(targetPasses);

  const sampleInfoData = new Uint32Array(4);

  try {
    for (let pass = 0; pass < targetPasses; pass++) {
      if (isSuperseded() || store.getState().cancelRequested) break;

      sampleInfoData[0] = pass;
      sampleInfoData[1] = pass + 1;
      device.queue.writeBuffer(sampleInfoBuf, 0, sampleInfoData);

      const enc = device.createCommandEncoder();
      const pass0 = enc.beginComputePass();
      pass0.setPipeline(pipeline);
      pass0.setBindGroup(0, bindGroup);
      pass0.dispatchWorkgroups(
        Math.ceil(cfg.width / 8),
        Math.ceil(cfg.height / 8)
      );
      pass0.end();
      enc.copyBufferToBuffer(outputBuf, 0, stagingBuf, 0, OUTPUT_BYTES);
      device.queue.submit([enc.finish()]);

      // eslint-disable-next-line no-await-in-loop
      await stagingBuf.mapAsync(GPUMapMode.READ, 0, OUTPUT_BYTES);
      if (isSuperseded()) {
        stagingBuf.unmap();
        break;
      }
      const mapped = stagingBuf.getMappedRange(0, OUTPUT_BYTES);
      const copy = new Uint8ClampedArray(mapped.slice(0));
      stagingBuf.unmap();

      ctx.putImageData(new ImageData(copy, cfg.width), 0, 0);
      store.getState().tickPass();
    }

    if (!isSuperseded()) {
      store.getState().completeRender();
    }
  } finally {
    device.destroy();
  }
};

export default renderProgressiveGpu;
