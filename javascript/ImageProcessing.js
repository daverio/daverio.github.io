// Load an Image Asynchronously
// Async Function: Extract White Pixels


export async function createRandomPixelsAsync(frameData,datasetName,dataMeta) {
    
    frameData[datasetName] = []
    console.log(dataMeta.numPixels,dataMeta.width,dataMeta.height)
    for (let i = 0; i < dataMeta.numPixels; i++) {
        const randomX = Math.random() * dataMeta.width * 4 - dataMeta.width*2;  // Random between -1 and 1
        const randomY = Math.random() * dataMeta.height * 4 - dataMeta.height*2;  // Random between -1 and 1
        frameData[datasetName].push(randomX, randomY);
    }
}

export async function extractWhitePixelsAsync(imagePath, frameData,datasetName,dataMeta) {
    console.log('Starting White Pixel Extraction...');
  
    // Load Image
    const image = await loadImage(imagePath);
  
    // Extract White Pixels
    const data = extractWhitePixelsHelper(image);
  
    // Store Result
    frameData[datasetName] = data.positions;
    if(!dataMeta.width) {
        dataMeta.width = data.width;
        dataMeta.height = data.height;
        dataMeta.numPixels = data.positions.length / 2;
    }
    else {
        if(dataMeta.width != data.width || dataMeta.height != data.height){
            //in the future, instead of throwing, we should transform the point coordinate here.
            const errorMessage = 'extractWhitePixelsAsync: Image has wrong dimensions!';
            throw new Error(errorMessage)
        }
        if(dataMeta.numPixels*2 < frameData[datasetName].length) {
            console.log('Too many pixels',dataMeta.numPixels,frameData[datasetName].length)
        }
        else if (dataMeta.numPixels*2 > frameData[datasetName].length) {
            const numMiss = dataMeta.numPixels - frameData[datasetName].length/2;
            console.log('Not enough pixels',dataMeta.numPixels,frameData[datasetName].length/2, numMiss)
            for (let i = 0; i < numMiss; i++){
                frameData[datasetName].push(frameData[datasetName][2*i],frameData[datasetName][2*i+1])
            }
            console.log('Not enough pixels solved',dataMeta.numPixels,frameData[datasetName].length/2)
        }
    }
  
    console.log('White Pixel Extraction Completed!');
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
  