import { createTheme } from '@mui/material';
import { FROSTED_FILTER, frostedGlassSx } from './frostedGlass';

const SCROLL_THUMB = 'rgba(185, 211, 207, 0.22)';
const SCROLL_THUMB_HOVER = 'rgba(185, 211, 207, 0.34)';
const SCROLL_THUMB_BORDER = 'rgba(185, 211, 207, 0.08)';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#b9d3cf',
    },
    secondary: {
      main: '#435061',
    },
    background: {
      default: '#0b1410',
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
          scrollbarColor: `${SCROLL_THUMB} transparent`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: 'transparent',
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 4,
            backgroundColor: SCROLL_THUMB,
            border: `1px solid ${SCROLL_THUMB_BORDER}`,
            backdropFilter: FROSTED_FILTER,
            WebkitBackdropFilter: FROSTED_FILTER,
            minHeight: 24,
            transition: 'background-color 120ms ease',
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover':
            {
              backgroundColor: SCROLL_THUMB_HOVER,
            },
          '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: frostedGlassSx,
      },
    },
  },
});
