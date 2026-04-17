import os
import re

TESSERACT_DIR = r'C:\Users\Admin\AppData\Local\Programs\Tesseract-OCR'
os.environ['PATH'] = TESSERACT_DIR + ';' + os.environ.get('PATH', '')

from PIL import Image, ImageFilter, ImageEnhance
import pytesseract

# Process page 2 (the transcript page)
image_path = r'D:\Opencode\Project 1\project 2\converted_images\page_-2.png'

img = Image.open(image_path)
img = img.convert('L')
img = ImageEnhance.Contrast(img).enhance(2.0)
img = img.filter(ImageFilter.SHARPEN)
text = pytesseract.image_to_string(img, config='--psm 6')

print('=== PAGE 2 RAW OCR ===')
print(text)
print('=== END ===')

# Try different patterns
print('\n=== LOOKING FOR COURSES ===')
lines = text.split('\n')
for line in lines:
    # Just look for ANY uppercase code + number pattern
    if re.search(r'[A-Z]{2,}\s*\d{3,}', line):
        print(f'LINE: {line}')
