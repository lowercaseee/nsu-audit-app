const poppler = require('pdf-poppler');
const path = require('path');

const opts = {
  format: 'png',
  dpi: 300,
  out_dir: path.join(__dirname, 'converted_images'),
  out_prefix: 'page_',
  page: null
};

const inputFile = path.join(__dirname, '694300494-nsu.pdf');

poppler.convert(inputFile, opts)
  .then(result => {
    console.log('Converted files:', result);
  })
  .catch(err => {
    console.error('Error:', err.message);
  });
