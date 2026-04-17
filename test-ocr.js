const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

async function testOCR() {
  const imageDir = path.join(__dirname, 'converted_images');
  const files = fs.readdirSync(imageDir).filter(f => f.endsWith('.png')).sort();

  for (const file of files) {
    console.log(`\n=== Processing ${file} ===`);
    const imagePath = path.join(imageDir, file);
    
    const result = await Tesseract.recognize(imagePath, 'eng', {
      logger: m => console.log(m.status, Math.round(m.progress * 100) + '%')
    });
    
    console.log('\n--- Raw OCR Text ---');
    console.log(result.data.text);
    console.log('\n--- Confidence:', result.data.confidence, '---');
  }
}

testOCR().catch(console.error);
