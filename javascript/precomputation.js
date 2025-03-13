import { extractWhitePixelsAsync,createRandomPixelsAsync } from "./ImageProcessing.js";

export async function waitForPrecomputations() {
    console.log('Starting precomputations...');
  
    // Array to Store Results
    const data = {};
    data.frames = {};
    data.meta = {}

    const base_path = "pages/";

    //we first load the metadata
    try {
        const response = await fetch(base_path + "metadata.json");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        data.meta = await response.json(); 
        console.log("Loaded JSON:", data.meta);
    } catch (error) {
        console.error("Error loading JSON:", error);
    }
    

    const pages_promises = []

    Object.keys(data.meta.pages).forEach((pagename) => {
        console.log(pagename);
        const promise = extractWhitePixelsAsync(pagename,data);
        pages_promises.push(promise);
    });
    // Launch All Precomputations more or less in a parallel...
    await Promise.all(pages_promises);

    //await Promise.all([
    //    extractWhitePixelsAsync('pages/homepage.png', data.frames,'homepage',data.meta),
    //    extractWhitePixelsAsync('pages/aboutme.png', data.frames,'aboutme',data.meta),
    //    
    //    // More precomputation functions can be added here
    //  ]);
    //
    // add missing pixels to all frames
    const length = {}
    let numPixels = 0;

    Object.entries(data.frames).forEach(([key,frame]) => {
        const frameNumPixels = frame.length / 2; 
        length[key] = frameNumPixels;
        if(numPixels < frameNumPixels){
            numPixels = frameNumPixels;
        }
    });

    data.meta.numPixels = numPixels;

    await createRandomPixelsAsync(data.frames,'whitenoise',data.meta)
  
    Object.entries(data.frames).forEach(([key,frame]) => {
        const numMiss = numPixels - (frame.length/2)
        for (let i = 0; i < numMiss; i++){
            frame.push(frame[2*i],frame[2*i+1])
            //frame.push(-3000,-3000)
        }

        for (let i = (frame.length)/2; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
            [frame[2*i],frame[2*i+1], frame[2*j],frame[2*j+1]] = [frame[2*j],frame[2*j+1], frame[2*i],frame[2*i+1]]; // Swap elements
        }
    });

    


    //console.log('Precomputations completed!', results.imageData.positions.length);
    return data;
}
  