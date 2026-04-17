import os
import sys

TESSERACT_DIR = r'C:\Users\Admin\AppData\Local\Programs\Tesseract-OCR'
os.environ['PATH'] = TESSERACT_DIR + ';' + os.environ.get('PATH', '')

from PIL import Image, ImageFilter, ImageEnhance
import pytesseract

pytesseract.pytesseract.tesseract_cmd = os.path.join(TESSERACT_DIR, 'tesseract.exe')

image_path = r'D:\Opencode\Project 1\project 2\converted_images\page_-3.png'

print('Processing:', image_path)

img = Image.open(image_path)
img = img.convert('L')
img = ImageEnhance.Contrast(img).enhance(2.0)
img = img.filter(ImageFilter.SHARPEN)

text = pytesseract.image_to_string(img, config='--psm 4')

print('=== OCR OUTPUT START ===')
print(text)
print('=== OCR OUTPUT END ===')
print('Length:', len(text))
