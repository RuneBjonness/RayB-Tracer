import React, { useEffect, useState } from 'react';
import {
  Box,
  CssBaseline,
  Divider,
  ThemeProvider,
  useMediaQuery,
} from '@mui/material';
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';

import useRayTracerStore from '../store';
import { getRenderConfiguration } from '../renderer/configuration';
import { ScenePreset } from '../scenes/scene-preset';
import { usePan } from '../hooks/usePan';
import { stageBackgroundSx } from '../styling/backgroundPattern';
import { FROSTED_BORDER } from '../styling/frostedGlass';
import { theme } from '../styling/theme';

import RtCanvas from './Canvas';
import Panel from './Panel';
import RenderHud from './RenderHud';
import RenderSettingsEditor from './RenderSettingsEditor';
import SceneSelector from './SceneSelector';

function App() {
  const sceneMode = useRayTracerStore((state) => state.sceneMode);
  const scenePreset = useRayTracerStore((state) => state.scenePreset);
  const sceneDefinition = useRayTracerStore((state) => state.sceneDefinition);

  const width = useRayTracerStore((state) => state.width);
  const height = useRayTracerStore((state) => state.height);
  const numberOfWorkers = useRayTracerStore((state) => state.numberOfWorkers);
  const renderMode = useRayTracerStore((state) => state.renderMode);

  const panelCollapsed = useRayTracerStore((state) => state.panelCollapsed);
  const collapseAllPanels = useRayTracerStore(
    (state) => state.collapseAllPanels
  );

  const [renderConfig, setRenderConfig] = useState(
    getRenderConfiguration(width, height, numberOfWorkers, renderMode)
  );
  const [renderScene, setRenderScene] = useState<ScenePreset | string | null>(
    null
  );

  const handleRenderClick = () => {
    setRenderConfig(
      getRenderConfiguration(width, height, numberOfWorkers, renderMode)
    );
    setRenderScene(sceneMode === 'scenePreset' ? scenePreset : sceneDefinition);
  };

  const isNarrow = useMediaQuery('(max-width: 720px)');
  const { pan, handlers: panHandlers } = usePan();

  useEffect(() => {
    if (isNarrow) {
      const openCount = Object.values(panelCollapsed).filter((c) => !c).length;
      if (openCount > 1) {
        collapseAllPanels();
      }
    }
    // Only run once on mount — we don't want to auto-collapse every time
    // the user resizes their window.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderPanel = (
    <Panel
      id="render"
      side="left"
      title="RayB Tracer"
      icon={<PlayArrowOutlinedIcon fontSize="small" />}
      stacked={isNarrow}
    >
      <RenderHud renderConfig={renderConfig} onRender={handleRenderClick} />
      <Divider sx={{ my: 2, borderColor: FROSTED_BORDER }} />
      <RenderSettingsEditor />
    </Panel>
  );

  const scenePanel = (
    <Panel
      id="scene"
      side="right"
      title="Scene"
      icon={<LandscapeOutlinedIcon fontSize="small" />}
      stacked={isNarrow}
      fullHeight
    >
      <SceneSelector />
    </Panel>
  );

  const panels = (
    <>
      {renderPanel}
      {scenePanel}
    </>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        {...panHandlers}
        sx={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          backgroundColor: theme.palette.background.default,
          ...stageBackgroundSx,
          cursor: 'grab',
          touchAction: 'none',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
            p: 2,
          }}
        >
          <RtCanvas
            sceneMode={sceneMode}
            scene={renderScene}
            cfg={renderConfig}
          />
        </Box>
      </Box>

      {isNarrow ? (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            zIndex: 1,
            // Let pointer events through the gaps to the stage below.
            pointerEvents: 'none',
            '& > *': { pointerEvents: 'auto' },
          }}
        >
          {panels}
        </Box>
      ) : (
        panels
      )}
    </ThemeProvider>
  );
}

export default App;
