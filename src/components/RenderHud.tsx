import React from 'react';
import {
  Button,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import useRayTracerStore from '../store';
import { RenderMode } from '../renderer/configuration';

type RenderHudProps = {
  onRender: () => void;
};

type RenderProgress = {
  current: number;
  total: number;
  label: string;
  canCancel: boolean;
};

const RenderHud = ({ onRender }: RenderHudProps) => {
  const width = useRayTracerStore((state) => state.width);
  const height = useRayTracerStore((state) => state.height);
  const renderMode = useRayTracerStore((state) => state.renderMode);
  const renderProgress = useRayTracerStore((state) => state.renderProgress);
  const isRendering = useRayTracerStore((state) => state.isRendering);
  const currentPass = useRayTracerStore((state) => state.currentPass);
  const targetPasses = useRayTracerStore((state) => state.targetPasses);
  const cancelRender = useRayTracerStore((state) => state.cancelRender);

  const isProgressive =
    renderMode === RenderMode.progressiveCpu ||
    renderMode === RenderMode.progressiveGpu;

  const progress: RenderProgress = isProgressive
    ? {
        current: currentPass,
        total: targetPasses,
        label: `Pass ${currentPass} / ${targetPasses}`,
        canCancel: true,
      }
    : {
        current: renderProgress,
        total: width * height,
        label: `${renderProgress} / ${width * height} pixels`,
        canCancel: false,
      };

  const pct =
    progress.total > 0 ? (progress.current * 100) / progress.total : 0;

  return (
    <Stack spacing={1.5}>
      <Button variant="outlined" onClick={onRender} disabled={isRendering}>
        Render
      </Button>
      <LinearProgress
        variant="determinate"
        color="success"
        value={Math.min(100, pct)}
      />
      <Typography variant="caption" align="center">
        [{progress.label}]
      </Typography>
      {isRendering && progress.canCancel && (
        <Button variant="outlined" color="warning" onClick={cancelRender}>
          Cancel
        </Button>
      )}
    </Stack>
  );
};

export default RenderHud;
