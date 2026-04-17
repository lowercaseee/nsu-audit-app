import os
os.environ['PATH'] = r'C:\Users\Admin\AppData\Local\Programs\Tesseract-OCR;' + os.environ.get('PATH', '')

from PIL import Image, ImageFilter, ImageEnhance
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r'C:\Users\Admin\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'

img = Image.open(r'D:\Opencode\Project 1\project 2\converted_images\page_-2.png')
img = img.convert('L')
img = ImageEnhance.Contrast(img).enhance(2.0)
img = img.filter(ImageFilter.SHARPEN)

# Try different PSM modes
for psm in ['6', '11', '3']:
    print(f'\n=== PSM {psm} ===')
    text = pytesseract.image_to_string(img, config=f'--psm {psm}')
    print(text[:500])
    print('---')
