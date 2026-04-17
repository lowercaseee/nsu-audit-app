const poppler = require('pdf-poppler');
const path = require('path');
const fs = require('fs');

async function convertPdfToImage(pdfPath) {
  const outDir = path.join(__dirname, '..', '..', 'uploads', 'pdf_images');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const opts = {
    format: 'png',
    dpi: 200,
    out_dir: outDir,
    out_prefix: 'page_',
    page: 1
  };

  const result = await poppler.convert(pdfPath, opts);
  return result[0];
}

module.exports = { convertPdfToImage };
