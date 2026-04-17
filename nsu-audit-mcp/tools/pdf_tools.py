from typing import Dict, Any


def generate_certificate(
    student_name: str,
    degree: str = "Bachelor of Business Administration",
    degree_completed: str = None
) -> Dict[str, Any]:
    """
    Generate a certificate PDF.
    
    Args:
        student_name: Name of the student
        degree: Degree being conferred
        degree_completed: Month/Year of degree completion
    
    Returns:
        Dictionary with PDF data (base64 encoded)
    """
    import base64
    from ..services.pdf import PdfService
    
    data = {
        'student': {
            'name': student_name,
            'degree': degree
        },
        'summary': {
            'degreeCompleted': degree_completed
        }
    }
    
    pdf_bytes = PdfService.generate_sync(data)
    pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
    
    return {
        'pdf': pdf_base64,
        'filename': f"certificate_{student_name.replace(' ', '_')}.pdf"
    }