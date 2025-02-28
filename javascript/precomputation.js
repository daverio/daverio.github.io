import { extractWhitePixelsAsync } from "./ImageProcessing.js";

export async function waitForPrecomputations() {
    console.log('Starting precomputations...');
  
    // Array to Store Results
    const results = {};
    results.imageData = {};
  
    // Launch All Precomputations in Parallel
    await Promise.all([
      extractWhitePixelsAsync('images/start.png', results.imageData),
      // More precomputation functions can be added here
    ]);
  
    console.log('Precomputations completed!', results.imageData.positions.length);
    return results;
}
  