export type RenderConfiguration = {
  width: number;
  height: number;

  renderMode: RenderMode;

  numberOfWorkers: number;
  maxDepth: number;

  maxIndirectLightSamples: number;

  maxLightSamples: number;
  adaptiveLightSamplingSensitivity: number;

  forceZeroAperture: boolean;
  maxFocalSamples: number;
  adaptiveFocalSamplingSensitivity: number;

  iterations: number;
};

export enum RenderMode {
  preview = 'Scene preview',
  dynamicSamplingPreview = 'Dynamic Sampling (preview)',
  dynamicSampling = 'Dynamic Sampling',
  indirectLightningPreview = 'Dynamic sampling with indirect lightning (preview)',
  indirectLightning = 'Dynamic sampling with indirect lightning',
  fixedSampling = 'Fixed sampling',
  webGpuPreview = 'WebGPU preview (experimental)',
  sharedMemoryPreview = 'Shared Memory preview (experimental)',
  progressiveCpu = 'Progressive CPU (experimental)',
  progressiveGpu = 'Progressive GPU (experimental)',
}

function renderConfiguration(
  width: number,
  height: number,
  numberOfWorkers: number,
  mode: RenderMode
): RenderConfiguration {
  return {
    width: width,
    height: height,
    renderMode: mode,
    numberOfWorkers: numberOfWorkers,
    maxDepth: 3,
    maxIndirectLightSamples: 0,
    maxLightSamples: 49,
    adaptiveLightSamplingSensitivity: 1,
    forceZeroAperture: false,
    maxFocalSamples: 81,
    adaptiveFocalSamplingSensitivity: 1,
    iterations: 0,
  };
}

export function getRenderConfiguration(
  width: number,
  height: number,
  numberOfWorkers: number,
  mode: RenderMode
): RenderConfiguration {
  const cfg = renderConfiguration(width, height, numberOfWorkers, mode);
  if (mode === RenderMode.preview) {
    cfg.forceZeroAperture = true;
    cfg.maxLightSamples = 1;
    cfg.maxFocalSamples = 1;
  } else if (mode === RenderMode.dynamicSamplingPreview) {
    cfg.adaptiveLightSamplingSensitivity = 0.2;
    cfg.adaptiveFocalSamplingSensitivity = 0.4;
  } else if (mode === RenderMode.dynamicSampling) {
    cfg.maxDepth = 8;
    cfg.adaptiveLightSamplingSensitivity = 0.002;
    cfg.adaptiveFocalSamplingSensitivity = 0.004;
  } else if (mode === RenderMode.indirectLightningPreview) {
    cfg.maxIndirectLightSamples = 1;
  } else if (mode === RenderMode.indirectLightning) {
    cfg.maxDepth = 8;
    cfg.maxIndirectLightSamples = 10;
    cfg.adaptiveLightSamplingSensitivity = 0.002;
    cfg.adaptiveFocalSamplingSensitivity = 0.004;
  } else if (mode === RenderMode.fixedSampling) {
    cfg.maxDepth = 10;
    cfg.maxIndirectLightSamples = 16;
    cfg.adaptiveLightSamplingSensitivity = -1;
    cfg.adaptiveFocalSamplingSensitivity = -1;
  } else if (
    mode === RenderMode.progressiveCpu ||
    mode === RenderMode.progressiveGpu
  ) {
    cfg.maxDepth = 4;
    cfg.iterations = 256;
  }
  return cfg;
}
