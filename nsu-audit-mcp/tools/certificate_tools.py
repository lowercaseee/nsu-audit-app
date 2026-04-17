import base64
from typing import List, Dict, Any


def save_certificate(
    user: str,
    pdf_base64: str,
    student_name: str = None
) -> Dict[str, Any]:
    """
    Save a certificate to disk.
    
    Args:
        user: User identifier (email or ID)
        pdf_base64: Base64 encoded PDF data
        student_name: Name of the student
    
    Returns:
        Save result with filename, path, timestamp
    """
    from ..services.certificate import CertificateService
    
    pdf_data = base64.b64decode(pdf_base64)
    result = CertificateService.save(user, pdf_data, student_name)
    
    return result


def get_certificates(user: str) -> List[Dict[str, Any]]:
    """
    Get all certificates for a user.
    
    Args:
        user: User identifier (email or ID)
    
    Returns:
        List of certificates with filename, timestamp, size
    """
    from ..services.certificate import CertificateService
    
    return CertificateService.get_by_user(user)


def get_certificate_file(filename: str) -> Dict[str, Any]:
    """
    Get a specific certificate file.
    
    Args:
        filename: Name of the certificate file
    
    Returns:
        Dictionary with file data (base64 encoded) or error
    """
    import base64
    from ..services.certificate import CertificateService
    
    data = CertificateService.get_file(filename)
    if data:
        return {
            'filename': filename,
            'data': base64.b64encode(data).decode('utf-8')
        }
    return {'error': 'File not found'}