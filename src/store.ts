import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { RenderMode } from './renderer/configuration';
import { ScenePreset } from './scenes/scene-preset';
import { SceneMode } from './scenes/scene';

export type PanelId = 'render' | 'scene';

export type PanelCollapsed = Record<PanelId, boolean>;

const defaultPanelCollapsed: PanelCollapsed = {
  render: false,
  scene: false,
};

interface RayTracerStore {
  sceneMode: SceneMode;
  scenePreset: ScenePreset;
  sceneDefinition: string;

  width: number;
  height: number;
  numberOfWorkers: number;
  renderMode: RenderMode;

  renderProgress: number;

  panelCollapsed: PanelCollapsed;

  setSceneMode: (sceneMode: SceneMode) => void;
  setScenePreset: (scenePreset: ScenePreset) => void;
  setSceneDefinition: (sceneDefinition: string) => void;

  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setNumberOfWorkers: (numberOfWorkers: number) => void;
  setRenderMode: (renderMode: RenderMode) => void;

  resetRenderProgress: () => void;
  incrementRenderProgress: (pixels: number) => void;

  togglePanel: (id: PanelId, singleOpen?: boolean) => void;
  collapseAllPanels: () => void;
}

const useRayTracerStore = create<RayTracerStore>()(
  devtools(
    persist(
      (set) => ({
        sceneMode: 'sceneDefinition',
        scenePreset: ScenePreset.teapot,
        sceneDefinition: '',
        width: 800,
        height: 600,
        numberOfWorkers: 8,
        renderMode: RenderMode.preview,
        renderProgress: 0,
        panelCollapsed: defaultPanelCollapsed,
        setSceneMode: (sceneMode) => set({ sceneMode }),
        setScenePreset: (scenePreset) => set({ scenePreset }),
        setSceneDefinition: (sceneDefinition) => set({ sceneDefinition }),
        setWidth: (width) => set({ width }),
        setHeight: (height) => set({ height }),
        setNumberOfWorkers: (numberOfWorkers) => set({ numberOfWorkers }),
        setRenderMode: (renderMode) => set({ renderMode }),
        resetRenderProgress: () => set({ renderProgress: 0 }),
        incrementRenderProgress: (pixels) =>
          set((state) => ({ renderProgress: state.renderProgress + pixels })),
        togglePanel: (id, singleOpen) =>
          set((state) => {
            const willExpand = state.panelCollapsed[id];
            if (willExpand && singleOpen) {
              // Expand this one, collapse everything else.
              return {
                panelCollapsed: { render: true, scene: true, [id]: false },
              };
            }
            return {
              panelCollapsed: {
                ...state.panelCollapsed,
                [id]: !state.panelCollapsed[id],
              },
            };
          }),
        collapseAllPanels: () =>
          set({ panelCollapsed: { render: true, scene: true } }),
      }),
      {
        name: 'rayb-tracer-storage',
      }
    )
  )
);

export default useRayTracerStore;
