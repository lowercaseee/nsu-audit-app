import os
import sys

tesseractPath = r'C:\Users\Admin\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'
tessdataPath = r'C:\Users\Admin\AppData\Local\Programs\Tesseract-OCR\tessdata'
imagePath = r'D:\Opencode\Project 1\project 2\test_images\test_-1.png'

os.environ['PATH'] = tesseractPath + ';' + os.environ.get('PATH', '')
os.environ['TESSDATA_PREFIX'] = tessdataPath

from PIL import Image, ImageFilter, ImageEnhance
import pytesseract

pytesseract.pytesseract.tesseract_cmd = tesseractPath

try:
    img = Image.open(imagePath)
    w, h = img.size
    print(f'Image size: {w}x{h}', file=sys.stderr)
    img = img.resize((w*2, h*2), Image.LANCZOS)
    img = img.convert('L')
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.5)
    for _ in range(2):
        img = img.filter(ImageFilter.SHARPEN)
    
    # Simple threshold without numpy
    img = img.point(lambda x: 0 if x < 128 else 255, '1')
    
    text = pytesseract.image_to_string(img, config='--psm 6')
    print('SUCCESS: Got text')
    print(text[:500])
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)
