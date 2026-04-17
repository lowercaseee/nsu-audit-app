import os
import sys

sys.path.insert(0, r'D:\Opencode\Project 1\project 2\node_modules\pdf-poppler\lib\win\poppler-0.51\bin')

pdf_path = r'D:\Opencode\Project 1\project 2\694300494-nsu.pdf'
output_dir = r'D:\Opencode\Project 1\project 2\test_images'

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

from pdf2image import convert_from_path
from PIL import Image

print('Converting PDF to images...')
images = convert_from_path(pdf_path, dpi=300, first_page=1, last_page=2)

print(f'Converted {len(images)} pages')

for i, img in enumerate(images):
    img_path = os.path.join(output_dir, f'test_page_{i+1}.png')
    img.save(img_path, 'PNG')
    print(f'Saved: {img_path}, size: {img.size}')

print('Testing OCR on first image...')

import pytesseract

TESSERACT_DIR = r'C:\Users\Admin\AppData\Local\Programs\Tesseract-OCR'
os.environ['PATH'] = TESSERACT_DIR + ';' + os.environ.get('PATH', '')
pytesseract.pytesseract.tesseract_cmd = os.path.join(TESSERACT_DIR, 'tesseract.exe')

img = Image.open(os.path.join(output_dir, 'test_page_1.png'))
img_gray = img.convert('L')

text = pytesseract.image_to_string(img_gray, config='--psm 6')

print('=== OCR OUTPUT ===')
print(text[:1000])
print('=== END ===')
