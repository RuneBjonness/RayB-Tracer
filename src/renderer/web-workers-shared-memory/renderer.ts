import { RenderConfiguration } from '../configuration';
import { Scene, SceneMode } from '../../scenes/scene';
import { loadScene, ScenePreset } from '../../scenes/scene-preset';
import { MatrixOrder } from '../../lib/math/matrices';

type CanvasPart = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const workerPool: Worker[] = [];

function createRenderPartList(
  cfg: RenderConfiguration,
  randomizeOrder: boolean
): CanvasPart[] {
  const chunkHeight = Math.min(
    16,
    Math.floor(cfg.height / cfg.numberOfWorkers)
  );
  const canvasParts: CanvasPart[] = [];
  for (let i = 0; i < cfg.height / chunkHeight; i++) {
    canvasParts.push({
      x: 0,
      y: i * chunkHeight,
      w: cfg.width,
      h: chunkHeight,
    });
  }
  canvasParts[canvasParts.length - 1].h =
    cfg.height - canvasParts[canvasParts.length - 1].y;

  if (randomizeOrder) {
    for (let i = canvasParts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [canvasParts[i], canvasParts[j]] = [canvasParts[j], canvasParts[i]];
    }
  }
  return canvasParts;
}

const renderWebWorkersSharedMemory = async (
  ctx: CanvasRenderingContext2D,
  cfg: RenderConfiguration,
  sceneMode: SceneMode,
  scene: ScenePreset | string | null,
  onProgress: (units: number) => void
) => {
  console.log(
    `renderWebWorkersSharedMemory(${cfg.width}X${cfg.height}) started - using ${cfg.numberOfWorkers} workers. (Supported hardware concurrency: ${navigator.hardwareConcurrency})`
  );

  performance.clearMarks();
  performance.mark('render-start');

  for (let i = 0; i < cfg.numberOfWorkers; i++) {
    if (workerPool.length <= i) {
      workerPool.push(
        new Worker(new URL('./renderer-worker.js', import.meta.url), {
          type: 'module',
        })
      );
    }
  }
  const canvasParts = createRenderPartList(cfg, true);
  performance.mark('preparations-complete');

  const preparedScene =
    sceneMode === 'scenePreset'
      ? await loadScene(scene as ScenePreset, cfg)
      : new Scene(JSON.parse(scene as string), cfg);

  performance.mark('scene-created');

  const buffers = preparedScene.toArrayBuffers(true, MatrixOrder.RowMajor);
  performance.mark('buffers-created');

  let activeWorkers = 0;

  for (let i = 0; i < cfg.numberOfWorkers; i++) {
    const worker = workerPool[i];

    worker.onmessage = function (e) {
      if (e.data.command === 'rtRenderTile') {
        const next = canvasParts.pop();
        if (next) {
          worker.postMessage({ command: 'rtRenderTile', cp: next });
        } else {
          activeWorkers--;
          if (activeWorkers === 0) {
            performance.mark('render-end');
            performance.measure('render', 'render-start', 'render-end');
            console.log(
              'Render stats:\n',
              `preparations: ${performance
                .measure(
                  'preparations',
                  'render-start',
                  'preparations-complete'
                )
                .duration.toFixed(1)} ms\n`,
              `building scene: ${performance
                .measure('scene', 'render-start', 'scene-created')
                .duration.toFixed(1)} ms\n`,
              `building buffers: ${performance
                .measure('buffers', 'scene-created', 'buffers-created')
                .duration.toFixed(1)} ms\n`,
              `render pass: ${performance
                .measure('render-pass', 'buffers-created', 'render-end')
                .duration.toFixed(1)} ms\n`,
              `total time: ${performance
                .measure('total', 'render-start', 'render-end')
                .duration.toFixed(1)} ms\n`
            );
          }
        }

        const cp: CanvasPart = e.data.cp;
        ctx!.putImageData(e.data.imageData, cp.x, cp.y);
        onProgress(cp.w * cp.h);
      } else if (e.data.command === 'initComplete') {
        const cp = canvasParts.pop();
        if (cp) {
          worker.postMessage({ command: 'rtRenderTile', cp });
          activeWorkers++;
        }
      }
    };

    worker.postMessage({
      command: 'init',
      camera: buffers.camera,
      lights: buffers.lights,
      objects: buffers.objects,
      materials: buffers.materials,
      patterns: buffers.patterns,
      imageData: buffers.imageData,
    });
  }
};

export default renderWebWorkersSharedMemory;
