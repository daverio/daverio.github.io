// Import Functions from Other Files
import { WebGLManager } from './WebGLManager.js';
import { waitForPrecomputations } from './precomputation.js';

async function main() {
  // Start Rotating Cube Animation
  const glManager = new WebGLManager('webgl-canvas');

  glManager.StartWaitingAnime();

  const results = await waitForPrecomputations();

  console.log(results.imageData.positions.length)

  glManager.StopWaitingAnime();

  //now we will finalize buffers and start the main webgl drawing loop.
 
}

main();