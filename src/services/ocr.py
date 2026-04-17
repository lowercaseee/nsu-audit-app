import re
import json
import sys
from PIL import Image, ImageFilter, ImageEnhance
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r'C:\Users\Admin\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'

def preprocess_image(image_path):
    img = Image.open(image_path)
    img = img.convert('L')
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    img = img.filter(ImageFilter.SHARPEN)
    return img

def extract_text(image_path):
    preprocessed = preprocess_image(image_path)
    text = pytesseract.image_to_string(preprocessed, config='--psm 6')
    return text

def parse_transcript(text):
    result = {
        'studentId': '',
        'studentName': '',
        'program': '',
        'courses': []
    }
    
    lines = text.split('\n')
    full_text = text.replace('\n', ' ')
    
    id_patterns = [
        r'(?:ID|Reg(?:istration)?|Student\s*ID|No\.?)\s*[:.]?\s*(\d{7,})',
        r'\b(19\d{5,})\b',
        r'\b(\d{8,})\b',
        r'(?:No|Number)\s*[:.]?\s*(\d{7,})'
    ]
    for pattern in id_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            result['studentId'] = match.group(1)
            break
    
    if not result['studentId']:
        id_match = re.search(r'(\d{7,})', full_text)
        if id_match:
            result['studentId'] = id_match.group(1)
    
    name_patterns = [
        r'(?:Name|Student)\s*[:.]?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)',
        r'UPON\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
        r'(?:Student|Name)\s*[:.]?\s*([A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z]+)'
    ]
    for pattern in name_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            result['studentName'] = match.group(1).strip().title()
            break
    
    if not result['studentName']:
        words = re.findall(r'\b([A-Z][a-z]+)\b', full_text)
        if len(words) >= 2:
            result['studentName'] = f"{words[0]} {words[1]}"
    
    program_keywords = [
        'Computer Science', 'Business Administration', 'Electrical Engineering',
        'Civil Engineering', 'Economics', 'Architecture', 'Pharmacy',
        'Microbiology', 'Biochemistry', 'Mathematics', 'Physics'
    ]
    for kw in program_keywords:
        if kw.lower() in full_text.lower():
            if kw == 'Computer Science':
                result['program'] = 'Computer Science & Engineering'
            else:
                result['program'] = kw
            break
    
    if not result['program']:
        result['program'] = 'Computer Science & Engineering'
    
    semester_pattern = r'(Spring|Summer|Fall|Winter)\s*[\'"]?\s*(\d{4})'
    
    all_courses = []
    
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
            
            skip_words = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'WITH', 'FROM', 'THIS', 'THAT', 'WHICH', 'HAVE', 'HAD', 'WAS', 'WERE', 'BEEN', 'BEING', 'SCHOOL', 'UNIVERSITY', 'OFFICE', 'NORTH', 'SOUTH', 'PRIVATE', 'BANGLADESH', 'FOUNDATION', 'CONFERRED', 'DEGREE', 'BACHELOR', 'AWARDED', 'REQUIREMENTS', 'COMPLETED', 'ELECTIVE', 'CORE', 'MAJOR', 'MINOR', 'TOTAL', 'CREDITS', 'GPA', 'CGPA', 'STATEMENT', 'TRANSCRIPT']
            if code_raw in skip_words:
                continue
            
            grade = ''
            grade_patterns = [
                r'(?:^|\s)([A+-](?!\w)|B(?!\w)|C(?!\w)|D(?!\w)|F|W)(?:$|\s)',
                r'\s([A+-]|B|C|D|F|W)\s',
                r'([A+-]|B|C|D|F|W)\s+\d'
            ]
            for gp in grade_patterns:
                gmatch = re.search(gp, line_clean, re.IGNORECASE)
                if gmatch:
                    grade = gmatch.group(1).upper()
                    break
            
            credit_match = re.search(r'(\d{1,2})\s*(?:cr|credit|credits?|units?|hours?)?', line_clean, re.IGNORECASE)
            credits = int(credit_match.group(1)) if credit_match else 3
            
            sem_match = re.search(semester_pattern, line, re.IGNORECASE)
            semester = f"{sem_match.group(1)} {sem_match.group(2)}" if sem_match else ''
            
            if grade in ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F', 'W']:
                all_courses.append({
                    'code': code,
                    'credits': min(credits, 6),
                    'grade': grade,
                    'semester': semester
                })
    
    seen = set()
    unique_courses = []
    for c in all_courses:
        key = f"{c['code']}-{c['semester']}"
        if key not in seen:
            seen.add(key)
            unique_courses.append(c)
    result['courses'] = unique_courses
    
    return result

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No image path provided'}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    try:
        text = extract_text(image_path)
        parsed = parse_transcript(text)
        
        print(json.dumps({
            'success': True,
            'data': parsed,
            'rawText': text
        }))
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
