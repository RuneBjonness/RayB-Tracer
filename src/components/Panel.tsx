import React, { ReactNode } from 'react';
import {
  Box,
  ButtonBase,
  Collapse,
  Stack,
  SxProps,
  Theme,
  Typography,
  useTheme,
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import useRayTracerStore, { PanelId } from '../store';
import { frostedGlassSx } from '../styling/frostedGlass';

type PanelProps = {
  id: PanelId;
  title: string;
  side: 'left' | 'right';
  icon?: ReactNode;
  stacked?: boolean;
  fullHeight?: boolean;
  children: ReactNode;
};

const flexFill = { flex: 1, minHeight: 0 } as const;

// MUI Collapse wraps its children in two nested divs. Without these selectors,
// those wrappers don't participate in the flex chain and fullHeight panels
// collapse back to their content's natural height.
const fullHeightCollapseSx = {
  ...flexFill,
  display: 'flex',
  '& .MuiCollapse-wrapper': flexFill,
  '& .MuiCollapse-wrapperInner': { ...flexFill, display: 'flex' },
};

type PanelHeaderProps = {
  headerId: string;
  bodyId: string;
  title: string;
  icon?: ReactNode;
  expanded: boolean;
  onToggle: () => void;
};

const PanelHeader = ({
  headerId,
  bodyId,
  title,
  icon,
  expanded,
  onToggle,
}: PanelHeaderProps) => {
  const theme = useTheme();
  const Chevron = expanded ? ExpandLessIcon : ExpandMoreIcon;

  return (
    <ButtonBase
      id={headerId}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={bodyId}
      sx={{
        width: '100%',
        px: 1.5,
        py: 1,
        justifyContent: 'flex-start',
        textAlign: 'left',
        borderBottom: expanded ? '1px solid rgba(185, 211, 207, 0.08)' : 'none',
        transition: 'background-color 120ms ease',
        '&:hover': { backgroundColor: 'rgba(185, 211, 207, 0.06)' },
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: -2,
        },
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ width: '100%', alignItems: 'center' }}
      >
        {icon ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: theme.palette.text.secondary,
            }}
          >
            {icon}
          </Box>
        ) : null}
        <Typography
          variant="subtitle2"
          sx={{
            flexGrow: 1,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            fontSize: 12,
            color: theme.palette.text.primary,
          }}
        >
          {title}
        </Typography>
        <Chevron
          fontSize="small"
          sx={{ color: theme.palette.text.secondary }}
        />
      </Stack>
    </ButtonBase>
  );
};

const Panel = ({
  id,
  title,
  side,
  icon,
  stacked,
  fullHeight,
  children,
}: PanelProps) => {
  const theme = useTheme();
  const collapsed = useRayTracerStore((s) => s.panelCollapsed[id]);
  const togglePanel = useRayTracerStore((s) => s.togglePanel);

  const headerId = `panel-${id}-header`;
  const bodyId = `panel-${id}-body`;
  const expanded = !collapsed;
  const fill = fullHeight && expanded;

  const layoutSx: SxProps<Theme> = stacked
    ? {
        position: 'relative',
        width: '100%',
        mb: 1.5,
        ...(fill && flexFill),
      }
    : {
        position: 'fixed',
        top: 0,
        [side]: 0,
        width: 400,
        m: 2,
        ...(fill && { bottom: 0 }),
      };

  const bodySx: SxProps<Theme> = fullHeight
    ? {
        p: 2,
        ...flexFill,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }
    : { p: 2, maxHeight: 'calc(100vh - 96px)', overflowY: 'auto' };

  return (
    <Box
      component="section"
      aria-labelledby={headerId}
      sx={{
        ...layoutSx,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        color: theme.palette.text.primary,
        ...frostedGlassSx,
      }}
    >
      <PanelHeader
        headerId={headerId}
        bodyId={bodyId}
        title={title}
        icon={icon}
        expanded={expanded}
        onToggle={() => togglePanel(id, stacked)}
      />
      <Collapse in={expanded} sx={fill ? fullHeightCollapseSx : undefined}>
        <Box id={bodyId} sx={bodySx}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};

export default Panel;
