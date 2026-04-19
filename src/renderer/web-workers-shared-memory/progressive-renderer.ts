import { RenderConfiguration } from '../configuration';
import { Scene, SceneMode } from '../../scenes/scene';
import { loadScene, ScenePreset } from '../../scenes/scene-preset';
import { MatrixOrder } from '../../lib/math/matrices';
import useRayTracerStore from '../../store';
import {
  createAccumulator,
  incrementSampleCount,
  resolveToImageData,
} from '../progressive/accumulator';

type Tile = { x: number; y: number; w: number; h: number };

function buildTiles(cfg: RenderConfiguration): Tile[] {
  const chunkHeight = Math.min(
    16,
    Math.max(1, Math.floor(cfg.height / cfg.numberOfWorkers))
  );
  const tiles: Tile[] = [];
  for (let y = 0; y < cfg.height; y += chunkHeight) {
    tiles.push({
      x: 0,
      y,
      w: cfg.width,
      h: Math.min(chunkHeight, cfg.height - y),
    });
  }
  return tiles;
}

// Token that identifies the currently-active driver invocation. A new
// render increments this; older drivers observe the mismatch and exit.
let currentDriverToken = 0;

// Fresh pool per driver invocation so message handlers for the previous
// render never leak into a new one. Workers are terminated when the loop
// exits (cancelled, completed, or errored).
function spawnWorkers(n: number): Worker[] {
  const pool: Worker[] = [];
  for (let i = 0; i < n; i++) {
    pool.push(
      new Worker(new URL('./renderer-worker.js', import.meta.url), {
        type: 'module',
      })
    );
  }
  return pool;
}

const renderProgressiveCpu = async (
  ctx: CanvasRenderingContext2D,
  cfg: RenderConfiguration,
  sceneMode: SceneMode,
  scene: ScenePreset | string | null,
  _onProgress: (units: number) => void
) => {
  if (scene == null) return;

  const myToken = ++currentDriverToken;
  const isSuperseded = () => myToken !== currentDriverToken;

  const workers = spawnWorkers(cfg.numberOfWorkers);

  try {
    const preparedScene =
      sceneMode === 'scenePreset'
        ? await loadScene(scene as ScenePreset, cfg)
        : new Scene(JSON.parse(scene as string), cfg);
    const buffers = preparedScene.toArrayBuffers(true, MatrixOrder.RowMajor);

    const acc = createAccumulator(cfg.width, cfg.height);

    await Promise.all(
      workers.map(
        (w) =>
          new Promise<void>((resolve) => {
            w.onmessage = (e) => {
              if (e.data.command === 'progressiveInitComplete') resolve();
            };
            w.postMessage({
              command: 'progressiveInit',
              camera: buffers.camera,
              lights: buffers.lights,
              objects: buffers.objects,
              materials: buffers.materials,
              patterns: buffers.patterns,
              imageData: buffers.imageData,
              accFloatsSab: acc.floatsSab,
              accWidth: acc.width,
            });
          })
      )
    );

    const tiles = buildTiles(cfg);
    const store = useRayTracerStore;
    const targetPasses =
      cfg.iterations > 0 ? cfg.iterations : store.getState().targetPasses;
    store.getState().startRender(targetPasses);

    const outImg = new ImageData(cfg.width, cfg.height);

    for (let pass = 0; pass < targetPasses; pass++) {
      if (isSuperseded() || store.getState().cancelRequested) break;

      // Passes are intentionally sequential — accumulation requires pass N's
      // tiles to all finish before pass N+1 begins. Cannot use Promise.all.
      // eslint-disable-next-line no-await-in-loop
      await new Promise<void>((resolveAll) => {
        let tileIndex = 0;
        let tilesRemaining = tiles.length;

        const dispatchNext = (w: Worker) => {
          if (tileIndex >= tiles.length) return;
          const tile = tiles[tileIndex++];
          w.postMessage({ command: 'progressiveTile', tile, passIndex: pass });
        };

        for (const w of workers) {
          w.onmessage = (e) => {
            if (e.data.command !== 'progressiveTileComplete') return;
            tilesRemaining--;
            if (tilesRemaining === 0) {
              resolveAll();
            } else {
              dispatchNext(w);
            }
          };
          dispatchNext(w);
        }
      });

      if (isSuperseded()) break;

      incrementSampleCount(acc);
      resolveToImageData(acc, outImg);
      ctx.putImageData(outImg, 0, 0);
      store.getState().tickPass();
    }

    if (!isSuperseded()) {
      store.getState().completeRender();
    }
  } finally {
    for (const w of workers) w.terminate();
  }
};

export default renderProgressiveCpu;
