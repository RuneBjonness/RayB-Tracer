import React, { useState } from 'react';
import RtCanvas from './Canvas';
import {
  Box,
  Button,
  createTheme,
  CssBaseline,
  Drawer,
  LinearProgress,
  Stack,
  ThemeProvider,
  Typography,
} from '@mui/material';
import RenderSettingsEditor from './RenderSettingsEditor';
import useRayTracerStore from '../store';
import { getRenderConfiguration, RenderMode } from '../renderer/configuration';
import SceneSelector from './SceneSelector';
import { ScenePreset } from '../scenes/scene-preset';

function App() {
  const sceneMode = useRayTracerStore((state) => state.sceneMode);
  const scenePreset = useRayTracerStore((state) => state.scenePreset);
  const sceneDefinition = useRayTracerStore((state) => state.sceneDefinition);

  const width = useRayTracerStore((state) => state.width);
  const height = useRayTracerStore((state) => state.height);
  const numberOfWorkers = useRayTracerStore((state) => state.numberOfWorkers);
  const renderMode = useRayTracerStore((state) => state.renderMode);
  const renderProgress = useRayTracerStore((state) => state.renderProgress);

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

  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#b9d3cf',
      },
      secondary: {
        main: '#435061',
      },
      background: {
        default: '#02211f',
        paper: '#0d2b29',
      },
      text: {
        primary: '#b9d3cf',
        secondary: '#506763',
      },
      action: {
        selected: '#b9d3cf',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: '#1e4745 #02211f',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              backgroundColor: '#02211f',
              width: 6,
              height: 6,
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              borderRadius: 3,
              backgroundColor: '#1e4745',
              minHeight: 24,
            },
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Drawer
          sx={{
            width: 480,
            flexShrink: 0,
            p: 2,
            '& .MuiDrawer-paper': {
              width: 480,
              boxSizing: 'border-box',
              p: 2,
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <Stack spacing={2}>
            <Typography
              variant="h3"
              noWrap
              sx={{
                fontStyle: 'italic',
                color: theme.palette.secondary.contrastText,
                mb: 1,
              }}
            >
              RayB Tracer
            </Typography>

            <Button variant="outlined" onClick={handleRenderClick}>
              Render
            </Button>
            <LinearProgress
              variant="determinate"
              color="success"
              value={
                (renderProgress * 100) /
                (renderMode === RenderMode.progressivePhotonMapping
                  ? renderConfig.iterations
                  : width * height)
              }
            />
            <Typography variant="caption" align="center">
              [{renderProgress}
              {renderMode === RenderMode.progressivePhotonMapping
                ? ` / ${renderConfig.iterations} iterations`
                : ` / ${width * height} pixels`}
              ]
            </Typography>

            <RenderSettingsEditor />
            <SceneSelector />
          </Stack>
        </Drawer>
        <Box sx={{ flexGrow: 1, p: 2 }}>
          <RtCanvas
            sceneMode={sceneMode}
            scene={renderScene}
            cfg={renderConfig}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
