import { BufferBackedCamera } from '../../lib/camera/buffer-backed-camera';
import { BufferBackedWorld } from '../../lib/world/buffer-backed-world';

let camera: BufferBackedCamera | null = null;
let w: BufferBackedWorld | null = null;

// Progressive-mode state: shared float accumulator written to directly.
let accFloats: Float32Array | null = null;
let accWidth = 0;

onmessage = async function (e) {
  if (e.data.command === 'rtRenderTile') {
    const cp: {
      x: number;
      y: number;
      w: number;
      h: number;
    } = e.data.cp;
    const imageData = camera!
      .renderPart(w!, cp.x, cp.y, cp.w, cp.h)
      .getImageData();
    postMessage({ command: 'rtRenderTile', cp, imageData }, [
      imageData.data.buffer,
    ]);
  } else if (e.data.command === 'init') {
    camera = new BufferBackedCamera(e.data.camera);
    w = new BufferBackedWorld(
      e.data.lights,
      e.data.objects,
      e.data.materials,
      e.data.patterns,
      e.data.imageData
    );
    postMessage({ command: 'initComplete' });
  } else if (e.data.command === 'progressiveInit') {
    camera = new BufferBackedCamera(e.data.camera);
    w = new BufferBackedWorld(
      e.data.lights,
      e.data.objects,
      e.data.materials,
      e.data.patterns,
      e.data.imageData
    );
    accFloats = new Float32Array(e.data.accFloatsSab);
    accWidth = e.data.accWidth;
    postMessage({ command: 'progressiveInitComplete' });
  } else if (e.data.command === 'progressiveTile') {
    const t: { x: number; y: number; w: number; h: number } = e.data.tile;
    camera!.renderProgressiveTile(
      w!,
      accFloats!,
      accWidth,
      t.x,
      t.y,
      t.w,
      t.h,
      e.data.passIndex
    );
    postMessage({ command: 'progressiveTileComplete' });
  }
};
