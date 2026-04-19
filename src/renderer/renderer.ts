import { RenderConfiguration, RenderMode } from './configuration';
import { SceneMode } from '../scenes/scene';
import { ScenePreset } from '../scenes/scene-preset';
import renderWebGpu from './webgpu/renderer';
import renderProgressiveGpu from './webgpu/progressive-renderer';
import renderWebWorkers from './web-workers/renderer';
import renderWebWorkersSharedMemory from './web-workers-shared-memory/renderer';
import renderProgressiveCpu from './web-workers-shared-memory/progressive-renderer';

const render = async (
  ctx: CanvasRenderingContext2D,
  cfg: RenderConfiguration,
  sceneMode: SceneMode,
  scene: ScenePreset | string | null,
  onProgress: (units: number) => void
) => {
  if (scene == null) {
    ctx!.fillRect(0, 0, cfg.width, cfg.height);
    return;
  } else {
    ctx!.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx!.fillRect(0, 0, cfg.width, cfg.height);
    ctx!.fillStyle = 'black';
  }

  if (cfg.renderMode === RenderMode.webGpuPreview) {
    return renderWebGpu(ctx, cfg, sceneMode, scene, onProgress);
  } else if (cfg.renderMode === RenderMode.sharedMemoryPreview) {
    return renderWebWorkersSharedMemory(ctx, cfg, sceneMode, scene, onProgress);
  } else if (cfg.renderMode === RenderMode.progressiveCpu) {
    return renderProgressiveCpu(ctx, cfg, sceneMode, scene, onProgress);
  } else if (cfg.renderMode === RenderMode.progressiveGpu) {
    return renderProgressiveGpu(ctx, cfg, sceneMode, scene, onProgress);
  }
  return renderWebWorkers(ctx, cfg, sceneMode, scene, onProgress);
};

export default render;
