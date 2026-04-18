import { Scene, SceneMode } from '../../scenes/scene';
import { ScenePreset, loadScene } from '../../scenes/scene-preset';
import { RenderConfiguration } from '../configuration';
import mainWgsl from './main.wgsl?raw';
import intersectionsWgsl from './intersections.wgsl?raw';
import previewRendererWgsl from './preview-renderer.wgsl?raw';
import materialsWgsl from './materials.wgsl?raw';
import { MatrixOrder } from '../../lib/math/matrices';

async function init(scene: Scene, ctx: CanvasRenderingContext2D) {
  if (!navigator.gpu) {
    throw Error('WebGPU not supported.');
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('No appropriate GPUAdapter found.');
  }

  let deviceDescriptor: GPUDeviceDescriptor | undefined;
  if (scene.name === 'MarbleMadness_100_BVH') {
    const canUse512MBStorageBuffers =
      adapter?.limits.maxStorageBufferBindingSize >= 512 * 1024 * 1024;
    if (!canUse512MBStorageBuffers) {
      throw new Error(
        `GPUAdapter does not support 512MB storage buffers. Max: ${adapter?.limits.maxStorageBufferBindingSize}`
      );
    }
    deviceDescriptor = {
      requiredLimits: { maxStorageBufferBindingSize: 512 * 1024 * 1024 },
    };
  }

  const device = await adapter.requestDevice(deviceDescriptor);

  const module = device.createShaderModule({
    code: mainWgsl + intersectionsWgsl + previewRendererWgsl + materialsWgsl,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: 'uniform',
        },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: 'read-only-storage',
        },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: 'read-only-storage',
        },
      },
      {
        binding: 3,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: 'read-only-storage',
        },
      },
      {
        binding: 4,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: 'read-only-storage',
        },
      },
      {
        binding: 5,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: 'uniform',
        },
      },
      {
        binding: 6,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: 'read-only-storage',
        },
      },
      {
        binding: 7,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: 'read-only-storage',
        },
      },
      {
        binding: 8,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: 'read-only-storage',
        },
      },
      {
        binding: 9,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: 'storage',
        },
      },
    ],
  });

  const pipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    }),
    compute: {
      module,
      entryPoint: 'main',
    },
  });

  const buffers = scene.toArrayBuffers(false, MatrixOrder.ColumnMajor);

  const cameraUniformBuffer = device.createBuffer({
    label: 'camera-uniform',
    size: Math.ceil(buffers.camera.byteLength / 16) * 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(cameraUniformBuffer, 0, buffers.camera);

  const shapesStorageBuffer = device.createBuffer({
    label: 'shapes-storage',
    size: Math.ceil(buffers.objects.shapesArrayBuffer.byteLength / 16) * 16,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    shapesStorageBuffer,
    0,
    buffers.objects.shapesArrayBuffer
  );

  const primitivesStorageBuffer = device.createBuffer({
    label: 'primitives-storage',
    size: Math.ceil(buffers.objects.primitivesArrayBuffer.byteLength / 16) * 16,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    primitivesStorageBuffer,
    0,
    buffers.objects.primitivesArrayBuffer
  );

  const trianglesStorageBuffer = device.createBuffer({
    label: 'triangles-storage',
    size: Math.ceil(buffers.objects.trianglesArrayBuffer.byteLength / 16) * 16,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(
    trianglesStorageBuffer,
    0,
    buffers.objects.trianglesArrayBuffer
  );

  const bvhStorageBuffer = device.createBuffer({
    label: 'bvh-storage',
    size: Math.ceil(buffers.objects.bvhArrayBuffer.byteLength / 16) * 16,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(bvhStorageBuffer, 0, buffers.objects.bvhArrayBuffer);

  const lightsStorageBuffer = device.createBuffer({
    label: 'lights-uniform',
    size: Math.ceil(buffers.lights.byteLength / 16) * 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(lightsStorageBuffer, 0, buffers.lights);

  const materialsStorageBuffer = device.createBuffer({
    label: 'materials-storage',
    size: Math.ceil(buffers.materials.byteLength / 16) * 16,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(materialsStorageBuffer, 0, buffers.materials);

  const patternsStorageBuffer = device.createBuffer({
    label: 'patterns-storage',
    size: Math.ceil(buffers.patterns.byteLength / 16) * 16,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(patternsStorageBuffer, 0, buffers.patterns);

  const imageDataStorageBuffer = device.createBuffer({
    label: 'image-data-storage',
    size: Math.ceil(buffers.imageData.byteLength / 16) * 16,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(imageDataStorageBuffer, 0, buffers.imageData);

  const OUTPUT_BUFFER_SIZE = scene.camera.width * scene.camera.height * 4;
  const output = device.createBuffer({
    label: 'output',
    size: OUTPUT_BUFFER_SIZE,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  const stagingBuffer = device.createBuffer({
    label: 'staging',
    size: OUTPUT_BUFFER_SIZE,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: cameraUniformBuffer,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: shapesStorageBuffer,
        },
      },
      {
        binding: 2,
        resource: {
          buffer: primitivesStorageBuffer,
        },
      },
      {
        binding: 3,
        resource: {
          buffer: trianglesStorageBuffer,
        },
      },
      {
        binding: 4,
        resource: {
          buffer: bvhStorageBuffer,
        },
      },
      {
        binding: 5,
        resource: {
          buffer: lightsStorageBuffer,
        },
      },
      {
        binding: 6,
        resource: {
          buffer: materialsStorageBuffer,
        },
      },
      {
        binding: 7,
        resource: {
          buffer: patternsStorageBuffer,
        },
      },
      {
        binding: 8,
        resource: {
          buffer: imageDataStorageBuffer,
        },
      },
      {
        binding: 9,
        resource: {
          buffer: output,
        },
      },
    ],
  });

  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.dispatchWorkgroups(
    Math.ceil(scene.camera.width / 8),
    Math.ceil(scene.camera.height / 8)
  );
  passEncoder.end();
  commandEncoder.copyBufferToBuffer(
    output,
    0,
    stagingBuffer,
    0,
    OUTPUT_BUFFER_SIZE
  );
  const commands = commandEncoder.finish();

  performance.mark('compute-pipeline-created');
  device.queue.submit([commands]);

  await stagingBuffer.mapAsync(GPUMapMode.READ, 0, OUTPUT_BUFFER_SIZE);
  const copyArrayBuffer = stagingBuffer.getMappedRange(0, OUTPUT_BUFFER_SIZE);
  const data = copyArrayBuffer.slice(0);
  stagingBuffer.unmap();

  performance.mark('webgpu-render-pass-end');

  const arr = new Uint8ClampedArray(data);
  const imageData = new ImageData(arr, scene.camera.width);
  ctx!.putImageData(imageData, 0, 0);

  performance.mark('result-drawn-to-screen');
}

const renderWebGpu = async (
  ctx: CanvasRenderingContext2D,
  cfg: RenderConfiguration,
  sceneMode: SceneMode,
  sceneDefinition: ScenePreset | string | null,
  _onProgress: (units: number) => void
) => {
  console.log(`renderWebGpu(${cfg.width}X${cfg.height}) started..`);

  performance.clearMarks();
  performance.mark('render-start');

  let scene: Scene;
  if (sceneMode === 'scenePreset') {
    scene = await loadScene(sceneDefinition as ScenePreset, cfg);
  } else {
    scene = new Scene(JSON.parse(sceneDefinition as string), cfg);
  }

  console.log(` -scene: ${scene.name}`);

  performance.mark('scene-created');

  await init(scene, ctx);
  performance.mark('render-end');

  console.log(
    'Render stats:\n',
    `building scene: ${performance
      .measure('scene', 'render-start', 'scene-created')
      .duration.toFixed(1)} ms\n`,
    `building compute pipeline: ${performance
      .measure('pipeline', 'scene-created', 'compute-pipeline-created')
      .duration.toFixed(1)} ms\n`,
    `render pass: ${performance
      .measure(
        'render-pass',
        'compute-pipeline-created',
        'webgpu-render-pass-end'
      )
      .duration.toFixed(1)} ms\n`,
    `draw to screen: ${performance
      .measure(
        'draw-to-screen',
        'webgpu-render-pass-end',
        'result-drawn-to-screen'
      )
      .duration.toFixed(1)} ms\n`,
    `total time: ${performance
      .measure('total', 'render-start', 'render-end')
      .duration.toFixed(1)} ms\n`
  );
};

export default renderWebGpu;
