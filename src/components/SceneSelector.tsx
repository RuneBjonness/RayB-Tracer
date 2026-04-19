import React from 'react';
import stringify from 'json-stringify-pretty-compact';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import useRayTracerStore from '../store';
import { ScenePreset } from '../scenes/scene-preset';
import { SceneMode } from '../scenes/scene';
import TemplateLoader from './TemplateLoader';
import { SceneDefinition } from '../scenes/scene-definition';

function SceneSelector() {
  const sceneMode = useRayTracerStore((state) => state.sceneMode);
  const setSceneMode = useRayTracerStore((state) => state.setSceneMode);

  const scenePreset = useRayTracerStore((state) => state.scenePreset);
  const setScenePreset = useRayTracerStore((state) => state.setScenePreset);

  const sceneDefinition = useRayTracerStore((state) => state.sceneDefinition);
  const setSceneDefinition = useRayTracerStore(
    (state) => state.setSceneDefinition
  );

  const handleSceneModeChange = (
    _event: React.SyntheticEvent,
    mode: SceneMode
  ) => {
    setSceneMode(mode);
  };
  const handleScenePresetChange = (event: SelectChangeEvent) => {
    const val = event.target.value as ScenePreset;
    setScenePreset(val);
  };
  const handleSceneTemplateChange = (definition: SceneDefinition) => {
    setSceneDefinition(stringify(definition, { indent: 4, maxLength: 60 }));
  };
  const handleSceneDefinitionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSceneDefinition(event.target.value);
  };

  const showingDefinition = sceneMode === 'sceneDefinition';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        width: '100%',
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={sceneMode} onChange={handleSceneModeChange}>
          <Tab label="Scene Builder" value={'sceneDefinition'} />
          <Tab label="Preset scenes" value={'scenePreset'} />
        </Tabs>
      </Box>
      {/* Using `hidden` rather than conditional rendering so both tabs keep
          their mounted state (scroll position, focus) across switches. */}
      <Box
        hidden={!showingDefinition}
        sx={
          showingDefinition
            ? {
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                pt: 1,
              }
            : undefined
        }
      >
        <TemplateLoader onLoaded={handleSceneTemplateChange} />
        <TextField
          fullWidth
          multiline
          minRows={6}
          value={sceneDefinition}
          onChange={handleSceneDefinitionChange}
          sx={{
            mt: 1,
            flex: 1,
            minHeight: 0,
            display: 'flex',
            '& .MuiInputBase-root': {
              flex: 1,
              minHeight: 0,
              alignItems: 'stretch',
              p: 1,
            },
            // MUI's multiline TextField writes inline `style="height: ..."`
            // based on content. `!important` is what lets the textarea fill
            // the flex container instead of growing with its content.
            '& textarea': {
              height: '100% !important',
              overflow: 'auto !important',
              resize: 'none',
              boxSizing: 'border-box',
            },
          }}
        />
      </Box>
      <Box hidden={showingDefinition}>
        <FormControl fullWidth sx={{ marginBottom: 1, marginTop: 2 }}>
          <InputLabel id="scene-preset-label">Presets</InputLabel>
          <Select
            labelId="scene-preset-label"
            id="scene-preset-select"
            label="Presets"
            size="small"
            value={scenePreset}
            onChange={handleScenePresetChange}
          >
            {(Object.keys(ScenePreset) as Array<keyof typeof ScenePreset>).map(
              (key) => (
                <MenuItem value={ScenePreset[key]} key={key}>
                  {ScenePreset[key]}
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

export default SceneSelector;
