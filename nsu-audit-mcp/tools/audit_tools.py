from typing import List, Dict, Any
from ..models.course import Course
from ..models.audit_result import AuditResult
from ..services.audit import AuditService, Program


def audit_courses(
    courses: List[Dict[str, Any]],
    program: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Audit courses against program requirements.
    
    Args:
        courses: List of course objects with 'code', 'grade', 'credits', 'semester' keys
        program: Optional program configuration (default: BBA program)
    
    Returns:
        Audit result with Level 1 (credits), Level 2 (CGPA), Level 3 (eligibility)
    """
    course_objects = [Course.from_dict(c) for c in courses]
    prog = Program.from_dict(program) if program else Program.default()
    
    result = AuditService.audit(course_objects, prog)
    
    return result.to_dict()


def calculate_cgpa(courses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate CGPA from courses.
    
    Args:
        courses: List of course objects with 'code', 'grade', 'credits' keys
    
    Returns:
        CGPA calculation result with cgpa, credits, gradePoints
    """
    course_objects = [Course.from_dict(c) for c in courses]
    result = AuditService.cgpa(course_objects)
    
    return {
        'cgpa': result['cgpa'],
        'credits': result['credits'],
        'gradePoints': result['gradePoints']
    }


def check_eligibility(
    courses: List[Dict[str, Any]],
    program: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Check if student is eligible for graduation.
    
    Args:
        courses: List of course objects
        program: Optional program configuration
    
    Returns:
        Eligibility result with eligible flag and reason
    """
    course_objects = [Course.from_dict(c) for c in courses]
    prog = Program.from_dict(program) if program else Program.default()
    
    result = AuditService.check_eligibility(course_objects, prog)
    
    return result