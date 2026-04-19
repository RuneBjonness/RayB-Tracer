import { Scene } from '../../scenes/scene';
import { loadScene } from '../../scenes/scene-preset';

let scene: Scene | null = null;

onmessage = async function (e) {
  if (e.data.command === 'init') {
    scene = null;
    scene = new Scene(JSON.parse(e.data.definition), e.data.renderCfg);
    postMessage({ command: 'initComplete' });
  } else if (e.data.command === 'initPreset') {
    scene = null;
    scene = await loadScene(e.data.scenePreset, e.data.renderCfg);
    postMessage({ command: 'initComplete' });
  } else if (e.data.command === 'rtRenderTile') {
    const cp: {
      x: number;
      y: number;
      w: number;
      h: number;
    } = e.data.cp;
    const imageData = scene!.renderTile(cp.x, cp.y, cp.w, cp.h);
    postMessage({ command: 'rtRenderTile', cp, imageData }, [
      imageData.data.buffer,
    ]);
  }
};
