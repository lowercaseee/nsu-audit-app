const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'converted_images');
const outputDir = path.join(__dirname, 'processed_images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.png'));

console.log('Image preprocessing script created.');
console.log('Since sharp is not available, use frontend Upload.jsx which now has built-in preprocessing:');
console.log('- Grayscale conversion');
console.log('- Contrast enhancement (1.5x)');
console.log('- Binary thresholding (140)');
console.log('- Noise reduction (3x3 kernel)');
console.log('\nThe converted PNG files in converted_images/ are already high-res (300 DPI).');
console.log('Upload them via the frontend - preprocessing happens automatically.');

files.forEach(f => {
  console.log(`- ${f}`);
});
