import { extractWhitePixelsAsync } from "./ImageProcessing.js";

export async function waitForPrecomputations() {
    console.log('Starting precomputations...');
  
    // Array to Store Results
    const data = {};
    data.frames = {};
    data.meta = {}
    
  
    // Launch All Precomputations in Parallel
    await Promise.all([
      extractWhitePixelsAsync('images/start.png', data.frames,'mainPicture',data.meta),
      // More precomputation functions can be added here
    ]);
  
    //console.log('Precomputations completed!', results.imageData.positions.length);
    return data;
}
  