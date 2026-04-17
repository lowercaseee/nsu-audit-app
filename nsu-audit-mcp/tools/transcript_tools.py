from typing import Dict, Any, Optional


def extract_transcript(text: str) -> Dict[str, Any]:
    """
    Extract student information and courses from transcript text.
    
    Args:
        text: OCR'd or manual transcript text
    
    Returns:
        Extracted data with student info and courses
    """
    from ..services.transcript import TranscriptService
    
    result = TranscriptService.extract(text)
    return result


def extract_from_image(image_base64: str) -> Dict[str, Any]:
    """
    Extract student information from image using OCR.
    
    Args:
        image_base64: Base64 encoded image data (with or without data URI prefix)
    
    Returns:
        Extracted data with student info and courses, or error message
    """
    from ..services.transcript import TranscriptService
    
    result = TranscriptService.extract_from_image(image_base64)
    return result


def get_demo_data() -> Dict[str, Any]:
    """
    Get demo transcript data for testing.
    
    Returns:
        Demo student data with courses
    """
    from ..services.transcript import TranscriptService
    
    return TranscriptService.get_demo_data()