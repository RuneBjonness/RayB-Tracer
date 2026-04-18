import React from 'react';
import TuneIcon from '@mui/icons-material/Tune';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import useRayTracerStore from '../store';
import { RenderMode } from '../renderer/configuration';
import ResolutionSelector from './ResolutionSelector';

function RenderSettingsEditor() {
  const width = useRayTracerStore((state) => state.width);
  const setWidth = useRayTracerStore((state) => state.setWidth);

  const height = useRayTracerStore((state) => state.height);
  const setHeight = useRayTracerStore((state) => state.setHeight);

  const numberOfWorkers = useRayTracerStore((state) => state.numberOfWorkers);
  const setNumberOfWorkers = useRayTracerStore(
    (state) => state.setNumberOfWorkers
  );

  const renderMode = useRayTracerStore((state) => state.renderMode);
  const setRenderMode = useRayTracerStore((state) => state.setRenderMode);

  const handleWidthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(event.target.value);
    if (val >= 0) {
      setWidth(val);
    }
  };

  const handleHeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(event.target.value);
    if (val >= 0) {
      setHeight(val);
    }
  };

  const handleNumberOfWorkersChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = Number(event.target.value);
    if (val >= 0) {
      setNumberOfWorkers(val);
    }
  };

  const handleRenderModeChange = (event: SelectChangeEvent) => {
    const val = event.target.value as RenderMode;
    setRenderMode(val as RenderMode);
  };

  return (
    <Stack spacing={1}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        <TuneIcon
          sx={{ verticalAlign: 'middle', paddingBottom: '3px', mr: 1 }}
        />
        Render Settings
      </Typography>
      <Stack direction="row" spacing={1}>
        <ResolutionSelector
          onSetResolution={(w: number, h: number): void => {
            setWidth(w);
            setHeight(h);
          }}
        />
        <TextField
          id="input-width"
          label="Width"
          size="small"
          value={width}
          onChange={handleWidthChange}
          slotProps={{
            htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' },
          }}
        />
        <TextField
          id="input-height"
          label="Height"
          size="small"
          value={height}
          onChange={handleHeightChange}
          slotProps={{
            htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' },
          }}
        />
        <TextField
          id="input-number-of-workers"
          label="Workers"
          size="small"
          value={numberOfWorkers}
          onChange={handleNumberOfWorkersChange}
          slotProps={{
            htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' },
          }}
        />
      </Stack>
      <FormControl fullWidth>
        <InputLabel id="render-mode-label">Render Mode</InputLabel>
        <Select
          labelId="render-mode-label"
          id="render-mode-select"
          label="Render Mode"
          size="small"
          value={renderMode}
          onChange={handleRenderModeChange}
        >
          {(Object.keys(RenderMode) as Array<keyof typeof RenderMode>).map(
            (key) => (
              <MenuItem value={RenderMode[key]} key={key}>
                {RenderMode[key]}
              </MenuItem>
            )
          )}
        </Select>
      </FormControl>
    </Stack>
  );
}

export default RenderSettingsEditor;
