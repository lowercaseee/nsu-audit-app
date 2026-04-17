import os
import sys
from pdf2image import convert_from_path
from PIL import Image, ImageFilter, ImageEnhance
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r'C:\Users\Admin\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'

def preprocess_and_ocr(image):
    img = image.convert('L')
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.5)
    img = img.filter(ImageFilter.SHARPEN)
    text = pytesseract.image_to_string(img, config='--psm 6')
    return text

def parse_transcript(text):
    import re
    result = {'studentId': '', 'studentName': '', 'program': '', 'courses': []}
    lines = text.split('\n')
    full_text = text.replace('\n', ' ')
    
    id_patterns = [r'(?:ID|Reg|No\.?)\s*[:.]?\s*(\d{7,})', r'\b(19\d{5,})\b', r'\b(\d{8,})\b']
    for pattern in id_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            result['studentId'] = match.group(1)
            break
    if not result['studentId']:
        id_match = re.search(r'(\d{7,})', full_text)
        if id_match:
            result['studentId'] = id_match.group(1)
    
    name_patterns = [r'(?:Name|Student)\s*[:.]?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)', r'UPON\s+([A-Z][a-z]+\s+[A-Z][a-z]+)']
    for pattern in name_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            result['studentName'] = match.group(1).strip().title()
            break
    
    program_keywords = ['Computer Science', 'Business Administration', 'Electrical Engineering', 'Civil Engineering', 'Economics']
    for kw in program_keywords:
        if kw.lower() in full_text.lower():
            result['program'] = 'Computer Science & Engineering' if kw == 'Computer Science' else kw
            break
    if not result['program']:
        result['program'] = 'Computer Science & Engineering'
    
    semester_pattern = r'(Spring|Summer|Fall|Winter)\s*[\'"]?\s*(\d{4})'
    
    for line in lines:
        line = line.strip()
        if not line or len(line) < 3:
            continue
        line_clean = re.sub(r'[^A-Za-z0-9+\-./\s]', ' ', line)
        line_clean = re.sub(r'\s+', ' ', line_clean).strip()
        
        course_pattern = r'([A-Z]{2,})\s*[\/\-.]?\s*(\d{3,})'
        matches = re.findall(course_pattern, line_clean)
        
        for match in matches:
            code_raw = match[0].upper()
            num = match[1]
            if len(code_raw) < 2 or len(num) < 3:
                continue
            code = code_raw + num
            
            skip_words = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'WITH', 'FROM', 'SCHOOL', 'UNIVERSITY', 'OFFICE', 'NORTH', 'SOUTH', 'PRIVATE', 'BANGLADESH', 'FOUNDATION', 'CONFERRED', 'DEGREE', 'BACHELOR', 'AWARDED', 'REQUIREMENTS', 'COMPLETED', 'ELECTIVE', 'CORE', 'MAJOR', 'MINOR', 'TOTAL', 'CREDITS', 'GPA', 'CGPA', 'STATEMENT', 'TRANSCRIPT']
            if code_raw in skip_words:
                continue
            
            grade = ''
            grade_patterns = [r'(?:^|\s)([A+-](?!\w)|B(?!\w)|C(?!\w)|D(?!\w)|F|W)(?:$|\s)', r'\s([A+-]|B|C|D|F|W)\s']
            for gp in grade_patterns:
                gmatch = re.search(gp, line_clean, re.IGNORECASE)
                if gmatch:
                    grade = gmatch.group(1).upper()
                    break
            
            credit_match = re.search(r'(\d{1,2})\s*(?:cr|credit|credits?|units?)?', line_clean, re.IGNORECASE)
            credits = int(credit_match.group(1)) if credit_match else 3
            
            sem_match = re.search(semester_pattern, line, re.IGNORECASE)
            semester = f"{sem_match.group(1)} {sem_match.group(2)}" if sem_match else ''
            
            if grade in ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F', 'W']:
                result['courses'].append({'code': code, 'credits': min(credits, 6), 'grade': grade, 'semester': semester})
    
    seen = set()
    unique_courses = []
    for c in result['courses']:
        key = f"{c['code']}-{c['semester']}"
        if key not in seen:
            seen.add(key)
            unique_courses.append(c)
    result['courses'] = unique_courses
    
    return result

if __name__ == '__main__':
    pdf_path = r'D:\Opencode\Project 1\project 2\694300494-nsu.pdf'
    output_dir = r'D:\Opencode\Project 1\project 2\converted_images'
    
    print('Converting PDF to images...')
    images = convert_from_path(pdf_path, dpi=300)
    
    print(f'Found {len(images)} pages')
    
    all_courses = []
    student_id = ''
    student_name = ''
    program = ''
    full_text = ''
    
    for i, img in enumerate(images):
        print(f'Processing page {i+1}...')
        text = preprocess_and_ocr(img)
        full_text += text + '\n'
        parsed = parse_transcript(text)
        
        if not student_id and parsed['studentId']:
            student_id = parsed['studentId']
        if not student_name and parsed['studentName']:
            student_name = parsed['studentName']
        if not program and parsed['program']:
            program = parsed['program']
        
        all_courses.extend(parsed['courses'])
        
        img.save(os.path.join(output_dir, f'page_{i+1}.png'), 'PNG')
    
    seen = set()
    unique_courses = []
    for c in all_courses:
        key = f"{c['code']}-{c['semester']}"
        if key not in seen:
            seen.add(key)
            unique_courses.append(c)
    
    import json
    print(json.dumps({
        'success': True,
        'data': {
            'studentId': student_id,
            'studentName': student_name,
            'program': program,
            'courses': unique_courses
        },
        'rawText': full_text
    }, indent=2))
