export const FROSTED_BG = 'rgba(13, 43, 41, 0.72)';
export const FROSTED_BORDER = 'rgba(185, 211, 207, 0.12)';
export const FROSTED_FILTER = 'blur(14px) saturate(140%)';
export const FROSTED_SHADOW = '0 8px 32px rgba(0,0,0,0.35)';

export const frostedGlassSx = {
  backgroundColor: FROSTED_BG,
  backgroundImage: 'none',
  backdropFilter: FROSTED_FILTER,
  WebkitBackdropFilter: FROSTED_FILTER,
  border: `1px solid ${FROSTED_BORDER}`,
  boxShadow: FROSTED_SHADOW,
} as const;
