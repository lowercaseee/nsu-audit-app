import re
import base64
import io
import json
import httpx
from PIL import Image
from typing import Dict, List, Any, Optional

OCR_API_KEY = "K86974848189557"
OCR_OVERLAY_KEY = "helloworld"

async def ocr_space_async(image_base64: str) -> Optional[str]:
    """Use OCR.space free API for text extraction"""
    try:
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.ocr.space/parse/image",
                headers={"apikey": OCR_API_KEY},
                files={"filename": ("image.jpg", base64.b64decode(image_base64), "image/jpeg")},
                data={"language": "eng", "isOverlayRequired": "false", "detectOrientation": "true", "scale": "true"}
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("ParsedResults"):
                    return result["ParsedResults"][0].get("ParsedText", "")
                elif result.get("ErrorMessage"):
                    print(f"OCR Error: {result.get('ErrorMessage')}")
    except Exception as e:
        print(f"OCR.space error: {e}")
    return None

def extract_student_info(text: str) -> Dict[str, str]:
    """Extract student name and ID from transcript text"""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    name = "NSU Student"
    student_id = "000000"
    
    for i, line in enumerate(lines):
        line_upper = line.upper()
        
        if 'STUDENT NAME' in line_upper or 'NAME' in line_upper:
            parts = line.split(':')
            if len(parts) > 1:
                name = parts[-1].strip()
            elif i + 1 < len(lines):
                name = lines[i + 1].strip()
        
        if 'STUDENT ID' in line_upper or 'ID NO' in line_upper or 'ID:' in line_upper:
            id_match = re.search(r'(\d{6,})', line)
            if id_match:
                student_id = id_match.group(1)
            elif i + 1 < len(lines):
                next_line = lines[i + 1]
                id_match = re.search(r'(\d{6,})', next_line)
                if id_match:
                    student_id = id_match.group(1)
    
    if student_id == "000000":
        for line in lines:
            id_match = re.search(r'(\d{6,})', line)
            if id_match:
                student_id = id_match.group(1)
                break
    
    if name == "NSU Student":
        for line in lines[:10]:
            words = line.split()
            if len(words) >= 2 and len(words) <= 4:
                has_letter = any(c.isalpha() for w in words for c in w)
                if has_letter and not any(c.isdigit() for w in words for c in w):
                    name = line.title()
                    break
    
    return {"name": name, "id": student_id}

def extract_courses_from_text(text: str) -> List[Dict]:
    """Extract courses from transcript text with improved patterns"""
    courses = []
    lines = text.split('\n')
    
    grade_patterns = [
        re.compile(r'^([A-Z]{2,4})\s*(\d{3,4})\s+([A-F][+\-]?)\s+(\d+\.?\d*)\s*$', re.IGNORECASE),
        re.compile(r'^([A-Z]{2,4})\s*(\d{3,4})\s+([A-F][+\-]?)\s*$', re.IGNORECASE),
        re.compile(r'([A-Z]{2,4})\s*(\d{3,4})\s+([A-F][+\-]?)\s+(\d+\.?\d*)', re.IGNORECASE),
        re.compile(r'([A-Z]{2,4})\s*(\d{3,4})\s+([A-F][+\-]?)', re.IGNORECASE),
    ]
    
    seen = set()
    semester_pattern = re.compile(r'(FALL|SPRING|SUMMER|WINTER)\s*(\d{4})', re.IGNORECASE)
    
    for line in lines:
        line = line.strip()
        if not line or len(line) < 6:
            continue
        
        semester = "Unknown"
        sem_match = semester_pattern.search(line)
        if sem_match:
            semester = f"{sem_match.group(1).title()} {sem_match.group(2)}"
        
        code = None
        grade = None
        credits = 3
        
        for pattern in grade_patterns:
            match = pattern.match(line)
            if match:
                groups = match.groups()
                code = f"{groups[0].upper()}{groups[1]}"
                grade = groups[2].upper()
                if len(groups) >= 4:
                    try:
                        credits = int(float(groups[3]))
                    except:
                        credits = 3
                break
        
        if not code:
            for pattern in grade_patterns[2:]:
                match = pattern.search(line)
                if match:
                    groups = match.groups()
                    code = f"{groups[0].upper()}{groups[1]}"
                    grade = groups[2].upper()
                    if len(groups) >= 4:
                        try:
                            credits = int(float(groups[3]))
                        except:
                            credits = 3
                    break
        
        if code and code not in seen and grade in ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']:
            courses.append({
                "code": code,
                "grade": grade,
                "credits": credits,
                "semester": semester
            })
            seen.add(code)
    
    return courses

async def extract_from_image(image_base64: str) -> Dict[str, Any]:
    """Main OCR function using cloud API"""
    
    text = await ocr_space_async(image_base64)
    
    if text:
        courses = extract_courses_from_text(text)
        student_info = extract_student_info(text)
        return {
            "courses": courses,
            "raw_text": text[:500],
            "success": True,
            "student": student_info
        }
    
    return {
        "courses": [],
        "raw_text": "",
        "success": False,
        "error": "OCR failed",
        "student": {"name": "Student", "id": "000000"}
    }

def extract_from_image_sync(image_base64: str) -> Dict[str, Any]:
    """Synchronous wrapper for compatibility"""
    import asyncio
    
    try:
        loop = asyncio.get_event_loop()
    except:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(extract_from_image(image_base64))