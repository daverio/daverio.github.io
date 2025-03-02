// Import Functions from Other Files
import { WebGLManager } from './WebGLManager.js';
import { waitForPrecomputations } from './precomputation.js';

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Start Rotating Cube Animation
  const glManager = new WebGLManager('webgl-canvas');

  glManager.StartWaitingAnime();
  const data = await waitForPrecomputations();
  glManager.createBuffers(data,'whitenoise')
  glManager.StopWaitingAnime();
  glManager.drawCurrent();

  glManager.startAnime(2,'pictureme');
  await wait(2000);
  glManager.stopAnime();
  await wait(1000);
  glManager.startAnime(1,'homepage');
  await wait(2000);
  glManager.stopAnime();
  await wait(20);
  glManager.startAnime(1,'aboutme');
  glManager.stopAnime();


  //await wait(3000);
  //glManager.startAnime(2,'homepage');
  //glManager.startVisual();

  //now we will finalize buffers and start the main webgl drawing loop.
 
}

main();