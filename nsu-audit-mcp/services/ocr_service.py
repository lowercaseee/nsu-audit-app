import re
import base64
import io
import json
import httpx
from PIL import Image
from typing import Dict, List, Any, Optional

OCR_API_KEY = "K86974848189557"

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


def fix_ocr_mistakes(code: str) -> str:
    """Fix common OCR mistakes: O→0, I→1 in course codes"""
    if not code:
        return code
    
    fixed = code
    
    # Fix O→0 in numeric positions (when surrounded by digits or at end of letter+number pattern)
    # Course codes like ACTO1 should be ACT01, or 101 could be 10I
    fixed = re.sub(r'([A-Z])O(?=\d)', r'\g<1>0', fixed)  # O followed by digit -> 0
    fixed = re.sub(r'O([A-Z])', r'0\1', fixed)  # O after digit before letter -> 0
    
    # Fix I→1 in numbers (when I is between digits or at end)
    fixed = re.sub(r'(\d)I(?=\d)', r'\g<1>1', fixed)
    fixed = re.sub(r'I(\d)', r'1\1', fixed)
    
    return fixed


def clean_grade(grade: str) -> Optional[str]:
    """Ensure grade is valid"""
    if not grade:
        return None
    grade = grade.upper().strip()
    valid_grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']
    if grade in valid_grades:
        return grade
    # Try partial match
    for vg in valid_grades:
        if grade.startswith(vg.replace('+', '').replace('-', '')):
            return vg
    return None


def clean_credits(credits: Any) -> int:
    """Ensure credits are numeric, default to 3"""
    if credits is None:
        return 3
    try:
        return int(float(str(credits)))
    except:
        return 3


VALID_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']

LEFT_SEMESTERS = [
    'SPRING 2007', 'SUMMER 2007', 'FALL 2007',
    'SPRING 2008', 'SUMMER 2008', 'FALL 2008',
    'SPRING 2009', 'SUMMER 2009'
]

RIGHT_SEMESTERS = [
    'FALL 2009', 'SPRING 2010', 'SUMMER 2010',
    'FALL 2010', 'SPRING 2011'
]

ALL_SEMESTERS = LEFT_SEMESTERS + RIGHT_SEMESTERS


def extract_student_info(text: str) -> Dict[str, str]:
    """Extract student info from Official Transcript section (top-right)"""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    name = "NSU Student"
    student_id = "000000"
    date_of_birth = ""
    degree = ""
    major = ""
    
    text_upper = text.upper()
    text_lower = text.lower()
    
    # Extract Name
    for i, line in enumerate(lines):
        line_upper = line.upper()
        if 'NAME' in line_upper and 'STUDENT' in line_upper:
            parts = line.split(':')
            if len(parts) > 1:
                name = parts[-1].strip()
            elif i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if next_line and not any(c.isdigit() for c in next_line):
                    name = next_line
                    break
    
    # Extract Student ID (6-10 digits)
    id_match = re.search(r'(\d{6,10})', text)
    if id_match:
        student_id = id_match.group(1)
    
    # Extract Date of Birth
    dob_patterns = [
        r'D[OB]?\s*:?\s*(\d{2}[/\-\.]?\d{2}[/\-\.]?\d{4})',
        r'DATE\s*OF\s*BIRTH\s*:?\s*(\d{2}[/\-\.]?\d{2}[/\-\.]?\d{4})',
        r'(\d{2}[/\-\.]?\d{2}[/\-\.]?\d{4})',
    ]
    for pattern in dob_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            date_of_birth = match.group(1)
            break
    
    # Extract Degree
    degree_patterns = [
        r'DEGREE\s*CONFERRED?\s*:?\s*([A-Z\.\s]+)',
        r'DEGREE\s*:?\s*([A-Z\.\s]+)',
        r'BACHELOR\s*OF\s*([A-Z\.\s]+)',
        r'(BBA|BSC|BS|BA|MBA|MASTER)',
    ]
    for pattern in degree_patterns:
        match = re.search(pattern, text_upper)
        if match:
            degree = match.group(1).strip()
            break
    
    # Extract Major
    major_patterns = [
        r'MAJOR\s*:?\s*([A-Z\s]+)',
        r'DEPARTMENT\s*:?\s*([A-Z\s]+)',
        r'PROGRAM\s*:?\s*([A-Z\s]+)',
    ]
    for pattern in major_patterns:
        match = re.search(pattern, text_upper)
        if match:
            major = match.group(1).strip()
            break
    
    return {
        "name": name,
        "student_id": student_id,
        "date_of_birth": date_of_birth,
        "degree": degree,
        "major": major
    }


def extract_summary_stats(text: str) -> Dict[str, str]:
    """Extract summary stats from Summary section (bottom-right)"""
    text_upper = text.upper()
    
    credits_counted = ""
    credits_passed = ""
    transfer_credits = ""
    total_grade_points = ""
    cgpa = ""
    degree_completed = ""
    
    # Credits Counted
    patterns = [
        r'TOTAL\s*CREDITS?\s*COUNTED\s*:?\s*(\d+)',
        r'CREDITS?\s*COUNTED\s*:?\s*(\d+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text_upper)
        if match:
            credits_counted = match.group(1)
            break
    
    # Credits Passed
    patterns = [
        r'TOTAL\s*CREDITS?\s*PASSED\s*:?\s*(\d+)',
        r'CREDITS?\s*PASSED\s*:?\s*(\d+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text_upper)
        if match:
            credits_passed = match.group(1)
            break
    
    # Transfer/Waiver Credits
    patterns = [
        r'TRANSFER\s*CREDITS?\s*:?\s*(\d+)',
        r'WAIVER\s*CREDITS?\s*:?\s*(\d+)',
        r'WITH\s*TRANSFER[/\s]*WAIVER\s*:?\s*(\d+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text_upper)
        if match:
            transfer_credits = match.group(1)
            break
    
    # Total Grade Points
    patterns = [
        r'TOTAL\s*GRADE\s*POINTS\s*:?\s*(\d+\.?\d*)',
        r'GRADE\s*POINTS\s*:?\s*(\d+\.?\d*)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text_upper)
        if match:
            total_grade_points = match.group(1)
            break
    
    # CGPA
    patterns = [
        r'CUMULATIVE\s*GRADE\s*POINT\s*AVERAGE\s*:?\s*(\d+\.?\d*)',
        r'CGPA\s*:?\s*(\d+\.?\d*)',
        r'GRADE\s*POINT\s*AVERAGE\s*:?\s*(\d+\.?\d*)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text_upper)
        if match:
            cgpa = match.group(1)
            break
    
    # Degree Completed (Month + Year)
    patterns = [
        r'DEGREE\s*COMPLETED\s*:?\s*([A-Z]+\s*\d{4})',
        r'COMPLETION\s*DATE\s*:?\s*([A-Z]+\s*\d{4})',
        r'MONTH\s*:?\s*([A-Z]+)\s*YEAR\s*:?\s*(\d{4})',
    ]
    for pattern in patterns:
        match = re.search(pattern, text_upper)
        if match:
            degree_completed = match.group(1).strip()
            if match.lastindex == 2:
                degree_completed = f"{match.group(1)} {match.group(2)}"
            break
    
    return {
        "credits_counted": credits_counted,
        "credits_passed": credits_passed,
        "transfer_credits": transfer_credits,
        "total_grade_points": total_grade_points,
        "cgpa": cgpa,
        "degree_completed": degree_completed
    }


def determine_graduation(summary: Dict[str, str]) -> Dict[str, Any]:
    """Determine graduation status based on credits"""
    credits_passed = int(summary.get('credits_passed', 0) or 0)
    credits_counted = int(summary.get('credits_counted', 0) or 0)
    degree_completed = summary.get('degree_completed', '')
    
    graduated = credits_passed >= 122 or credits_counted >= 122
    
    year_match = re.search(r'(\d{4})', degree_completed)
    graduation_year = year_match.group(1) if year_match else ''
    
    return {
        "graduated": graduated,
        "graduation_year": graduation_year
    }


def clean_course(course: Dict) -> Optional[Dict]:
    """Clean and validate a single course"""
    code = course.get('code', '')
    if not code:
        return None
    
    # Fix OCR mistakes
    code = fix_ocr_mistakes(code)
    
    grade = clean_grade(course.get('grade', ''))
    if not grade:
        return None
    
    credits = clean_credits(course.get('credits', 3))
    
    return {
        "code": code.upper(),
        "title": course.get('title', '').strip(),
        "credits": credits,
        "grade": grade
    }


def remove_duplicates(courses: List[Dict]) -> List[Dict]:
    """Remove duplicate courses by code"""
    seen = set()
    unique = []
    for course in courses:
        code = course.get('code', '')
        if code and code not in seen:
            seen.add(code)
            unique.append(course)
    return unique


def extract_all_semesters(text: str) -> List[Dict]:
    """Extract all semester courses from left and right columns"""
    lines = [l.strip() for l in text.split('\n')]
    
    results = []
    current_semester = None
    current_column = None
    current_courses = []
    
    course_line_pattern = re.compile(
        r'^([A-Z]{2,4})\s*(\d{3,4})\s+([A-Za-z\s]+?)\s+(\d)\s+([A-F][+\-]?)\s*$',
        re.IGNORECASE
    )
    
    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            continue
        
        line_upper = line_stripped.upper()
        
        # Detect semester and column
        # Left column
        for sem in LEFT_SEMESTERS:
            if sem in line_upper:
                # Save previous semester data
                if current_semester and current_courses:
                    cleaned = [c for c in current_courses if clean_course(c)]
                    if cleaned:
                        results.append({
                            "semester": current_semester,
                            "column": current_column,
                            "courses": remove_duplicates(cleaned)
                        })
                current_semester = sem.title()
                current_column = "left"
                current_courses = []
                break
        
        # Right column
        for sem in RIGHT_SEMESTERS:
            if sem in line_upper:
                if current_semester and current_courses:
                    cleaned = [c for c in current_courses if clean_course(c)]
                    if cleaned:
                        results.append({
                            "semester": current_semester,
                            "column": current_column,
                            "courses": remove_duplicates(cleaned)
                        })
                current_semester = sem.title()
                current_column = "right"
                current_courses = []
                break
        
        # Skip TGPA/CGPA lines
        if 'TGPA' in line_upper or 'CGPA' in line_upper:
            continue
        
        # Skip if no valid semester detected
        if not current_semester:
            continue
        
        # Try to match course line
        match = course_line_pattern.match(line_stripped)
        if match:
            course = {
                "code": f"{match.group(1)}{match.group(2)}",
                "title": match.group(3).strip(),
                "credits": match.group(4),
                "grade": match.group(5).upper()
            }
            if clean_course(course):
                current_courses.append(course)
    
    # Save last semester
    if current_semester and current_courses:
        cleaned = [c for c in current_courses if clean_course(c)]
        if cleaned:
            results.append({
                "semester": current_semester,
                "column": current_column,
                "courses": remove_duplicates(cleaned)
            })
    
    return results


async def extract_from_image(image_base64: str) -> Dict[str, Any]:
    """Main OCR function - unified extraction from transcript image"""
    
    text = await ocr_space_async(image_base64)
    
    if not text:
        return {
            "success": False,
            "error": "OCR failed",
            "student_info": {"name": "", "student_id": "", "date_of_birth": "", "degree": "", "major": ""},
            "summary": {"credits_counted": "", "credits_passed": "", "transfer_credits": "", "total_grade_points": "", "cgpa": "", "degree_completed": ""},
            "graduation": {"graduated": False, "graduation_year": ""},
            "semesters": []
        }
    
    # Extract all components
    student_info = extract_student_info(text)
    summary = extract_summary_stats(text)
    graduation = determine_graduation(summary)
    semesters = extract_all_semesters(text)
    
    return {
        "success": True,
        "student_info": student_info,
        "summary": summary,
        "graduation": graduation,
        "semesters": semesters,
        "raw_text": text[:1000]
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