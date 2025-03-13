// Load an Image Asynchronously
// Async Function: Extract White Pixels


export async function createRandomPixelsAsync(frameData,datasetName,dataMeta) {
    
    frameData[datasetName] = []
    for (let i = 0; i < dataMeta.numPixels; i++) {
        const randomX = Math.random() * dataMeta.width * 2 - dataMeta.width /2 ;  // Random between -1 and 1
        const randomY = Math.random() * dataMeta.height * 2 - dataMeta.height / 2;  // Random between -1 and 1
        frameData[datasetName].push(randomX, randomY);
    }
}

export async function extractWhitePixelsAsync(pagename,data) {
  
    const image = await loadImage(data.meta.base_path + data.meta.pages[pagename].source);
    const imagedata = extractWhitePixelsHelper(image);
  
    // Store Result
    data.frames[pagename] = imagedata.positions;
    if(data.meta.width != imagedata.width || data.meta.height != imagedata.height){
            //in the future, instead of throwing, we should transform the point coordinate here.
        const errorMessage = 'extractWhitePixelsAsync: Image has wrong dimensions!';
        throw new Error(errorMessage);
    }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'Anonymous';  // Allow cross-origin images
      image.src = src;
      image.onload = () => resolve(image);
      image.onerror = (error) => reject(error);
    });
}
  
  // Extract White Pixel Coordinates from an Image
function extractWhitePixelsHelper(image) {
    // Create Off-Screen Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
  
    // Get Image Data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const positions = [];
  
    // Loop Through Each Pixel
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
  
        // Check if Pixel is White
        if (r > 240 && g > 240 && b > 240 && a > 240) {
          positions.push(x, y);
        }
      }
    }
  
    // Return Positions and Image Dimensions
    return {
      positions,
      width: image.width,
      height: image.height
    };
}
  