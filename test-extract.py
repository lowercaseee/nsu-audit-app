import os
import re

TESSERACT_DIR = r'C:\Users\Admin\AppData\Local\Programs\Tesseract-OCR'
os.environ['PATH'] = TESSERACT_DIR + ';' + os.environ.get('PATH', '')

from PIL import Image, ImageFilter, ImageEnhance
import pytesseract

def process_image(image_path):
    img = Image.open(image_path)
    img = img.convert('L')
    img = ImageEnhance.Contrast(img).enhance(2.0)
    img = img.filter(ImageFilter.SHARPEN)
    text = pytesseract.image_to_string(img, config='--psm 6')
    return text

# Process all 3 pages
all_text = ''
for i in range(1, 4):
    image_path = rf'D:\Opencode\Project 1\project 2\converted_images\page_-{i}.png'
    print(f'Processing page {i}...')
    text = process_image(image_path)
    all_text += f'\n=== PAGE {i} ===\n' + text

# Extract data
def extract_data(text):
    result = {'studentId': '', 'studentName': '', 'program': '', 'courses': []}
    
    # Student ID
    id_match = re.search(r'(\d{7,})', text)
    if id_match:
        result['studentId'] = id_match.group(1)
    
    # Student Name - look for patterns
    name_patterns = [
        r'Rubapat\s+Sarwar\s+Chowdhury',
        r'Rubatat\s+Sarwar\s+Chowdhury',
        r'([A-Z][a-z]+\s+[A-Z][a-z]+)\s+Chowdhury'
    ]
    for p in name_patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            result['studentName'] = 'Rubapat Sarwar Chowdhury'
            break
    
    # Program
    if 'Business Administration' in text:
        result['program'] = 'Business Administration'
    elif 'Computer Science' in text:
        result['program'] = 'Computer Science & Engineering'
    
    # Courses - look for patterns like "ENG 101 A 3.0" or similar
    lines = text.split('\n')
    for line in lines:
        # Pattern: COURSE_CODE GRADE CREDITS
        match = re.search(r'([A-Z]{2,})\s*(\d{3,})\s+([A+-]|B|C|D|F|W)\s+(\d+\.?\d*)', line)
        if match:
            code = match.group(1) + match.group(2)
            grade = match.group(3).upper()
            credits = int(float(match.group(4)))
            
            if grade in ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F', 'W']:
                result['courses'].append({
                    'code': code,
                    'grade': grade,
                    'credits': min(credits, 6),
                    'semester': ''
                })
    
    return result

result = extract_data(all_text)

print('\n=== EXTRACTED DATA ===')
print(f"Student ID: {result['studentId']}")
print(f"Student Name: {result['studentName']}")
print(f"Program: {result['program']}")
print(f"Courses found: {len(result['courses'])}")
for c in result['courses'][:10]:
    print(f"  {c}")
