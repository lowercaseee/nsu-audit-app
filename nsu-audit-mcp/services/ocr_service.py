import re
import base64
import io
import json
import httpx
from PIL import Image
from typing import Dict, List, Any, Optional

OCR_API_KEY = "helloworld"

async def ocr_space_async(image_base64: str) -> Optional[str]:
    """Use OCR.space free API for text extraction"""
    try:
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.ocr.space/parse/image",
                headers={"apikey": OCR_API_KEY},
                files={"filename": ("image.jpg", base64.b64decode(image_base64), "image/jpeg")},
                data={"language": "eng", "isOverlayRequired": "false"}
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("ParsedResults"):
                    return result["ParsedResults"][0].get("ParsedText", "")
    except Exception as e:
        print(f"OCR.space error: {e}")
    return None

def extract_courses_from_text(text: str) -> List[Dict]:
    """Extract courses from transcript text"""
    courses = []
    
    lines = text.split('\n')
    
    course_pattern = re.compile(
        r'([A-Z]{2,})\s*(\d{3,4})\s*([A-F][+\-]?)\s*(\d+\.?\d*)',
        re.IGNORECASE
    )
    
    simple_pattern = re.compile(
        r'([A-Z]{2,})\s*(\d{3,4})\s*([A-F][+\-]?)',
        re.IGNORECASE
    )
    
    seen = set()
    
    for line in lines:
        line = line.strip()
        if not line or len(line) < 5:
            continue
        
        match = course_pattern.search(line)
        if not match:
            match = simple_pattern.search(line)
        
        if match:
            groups = match.groups()
            code = f"{groups[0].upper()}{groups[1]}"
            grade = groups[2].upper()
            credits = 3
            
            if len(groups) >= 4:
                try:
                    credits = int(float(groups[3]))
                except:
                    credits = 3
            
            if code not in seen and grade in ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']:
                courses.append({
                    "code": code,
                    "grade": grade,
                    "credits": credits,
                    "semester": "Unknown"
                })
                seen.add(code)
    
    return courses

async def extract_from_image(image_base64: str) -> Dict[str, Any]:
    """Main OCR function using cloud API"""
    
    text = await ocr_space_async(image_base64)
    
    if text:
        courses = extract_courses_from_text(text)
        return {
            "courses": courses,
            "raw_text": text[:500],
            "success": True
        }
    
    return {
        "courses": [],
        "raw_text": "",
        "success": False,
        "error": "OCR failed"
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