import React from 'react';
import {
  Button,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import useRayTracerStore from '../store';
import { RenderConfiguration, RenderMode } from '../renderer/configuration';

type RenderHudProps = {
  renderConfig: RenderConfiguration;
  onRender: () => void;
};

const RenderHud = ({ renderConfig, onRender }: RenderHudProps) => {
  const width = useRayTracerStore((state) => state.width);
  const height = useRayTracerStore((state) => state.height);
  const renderMode = useRayTracerStore((state) => state.renderMode);
  const renderProgress = useRayTracerStore((state) => state.renderProgress);

  const isPhotonMapping = renderMode === RenderMode.progressivePhotonMapping;
  const total = isPhotonMapping ? renderConfig.iterations : width * height;
  const unit = isPhotonMapping ? 'iterations' : 'pixels';

  return (
    <Stack spacing={1.5}>
      <Button variant="outlined" onClick={onRender}>
        Render
      </Button>
      <LinearProgress
        variant="determinate"
        color="success"
        value={(renderProgress * 100) / total}
      />
      <Typography variant="caption" align="center">
        [{renderProgress} / {total} {unit}]
      </Typography>
    </Stack>
  );
};

export default RenderHud;
