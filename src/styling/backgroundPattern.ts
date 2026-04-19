// Sparse "RayB Tracer" watermark tile, layered on top of the dot grid. Three
// occurrences at varied sizes within a 480×320 tile break up the regularity so
// it reads as scattered rather than a grid.
const WATERMARK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320">' +
  '<g font-family="Roboto, sans-serif" font-style="italic" font-weight="700" fill="#b9d3cf">' +
  '<text x="20" y="90" font-size="28" opacity="0.07">RayB Tracer</text>' +
  '<text x="290" y="190" font-size="20" opacity="0.05">RayB Tracer</text>' +
  '<text x="100" y="290" font-size="22" opacity="0.06">RayB Tracer</text>' +
  '</g>' +
  '</svg>';

const WATERMARK_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  WATERMARK_SVG
)}")`;

const DOT_GRID =
  'radial-gradient(circle, rgba(185, 211, 207, 0.09) 1px, transparent 1px)';

export const stageBackgroundSx = {
  backgroundImage: `${WATERMARK_URL}, ${DOT_GRID}`,
  backgroundSize: '480px 320px, 24px 24px',
} as const;
