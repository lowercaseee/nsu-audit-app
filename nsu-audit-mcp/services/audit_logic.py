GRADE_POINTS = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'D': 1.0, 'F': 0.0
}

NON_EARNING = ['F', 'W', 'I', 'Z', 'Cr']

PROGRAM = {
    'name': 'BBA',
    'totalCredits': 120,
    'mandatoryGed': ['ENG101', 'ENG102', 'ENG111', 'ENG112'],
    'coreMath': ['MAT101', 'MAT104', 'STA101'],
    'coreBusiness': ['BUS101', 'BUS201', 'BUS251', 'BUS301', 'BUS401'],
    'majorCore': ['FIN254', 'FIN331', 'FIN433', 'MGT210', 'MGT301', 'MGT314', 'MGT401']
}

DEMO_COURSES = [
    {'code': 'ENG101', 'grade': 'A', 'credits': 3, 'semester': 'Fall 2006'},
    {'code': 'MAT101', 'grade': 'A', 'credits': 3, 'semester': 'Fall 2006'},
    {'code': 'BUS101', 'grade': 'A-', 'credits': 3, 'semester': 'Fall 2006'},
    {'code': 'ENG102', 'grade': 'B+', 'credits': 3, 'semester': 'Spring 2007'},
    {'code': 'MAT104', 'grade': 'B', 'credits': 3, 'semester': 'Spring 2007'},
    {'code': 'ACT201', 'grade': 'A', 'credits': 3, 'semester': 'Spring 2007'},
    {'code': 'ENG103', 'grade': 'A', 'credits': 3, 'semester': 'Summer 2007'},
    {'code': 'STA101', 'grade': 'B+', 'credits': 3, 'semester': 'Summer 2007'},
    {'code': 'MIS201', 'grade': 'A', 'credits': 3, 'semester': 'Fall 2007'},
    {'code': 'BUS201', 'grade': 'A', 'credits': 3, 'semester': 'Fall 2007'},
    {'code': 'ACT202', 'grade': 'A-', 'credits': 3, 'semester': 'Fall 2007'},
    {'code': 'MGT210', 'grade': 'A', 'credits': 3, 'semester': 'Spring 2008'},
    {'code': 'ECO172', 'grade': 'B', 'credits': 3, 'semester': 'Spring 2008'},
    {'code': 'LAW200', 'grade': 'B+', 'credits': 3, 'semester': 'Spring 2008'},
    {'code': 'BUS251', 'grade': 'A', 'credits': 3, 'semester': 'Fall 2008'},
    {'code': 'MGT301', 'grade': 'A', 'credits': 3, 'semester': 'Fall 2008'},
    {'code': 'FIN254', 'grade': 'A', 'credits': 3, 'semester': 'Fall 2008'},
    {'code': 'ECO173', 'grade': 'B+', 'credits': 3, 'semester': 'Spring 2009'},
    {'code': 'BUS301', 'grade': 'A', 'credits': 3, 'semester': 'Spring 2009'},
    {'code': 'FIN331', 'grade': 'A', 'credits': 3, 'semester': 'Spring 2009'},
    {'code': 'MGT314', 'grade': 'A', 'credits': 3, 'semester': 'Summer 2009'},
    {'code': 'ACT322', 'grade': 'A', 'credits': 3, 'semester': 'Fall 2009'},
    {'code': 'FIN433', 'grade': 'A', 'credits': 3, 'semester': 'Fall 2009'},
    {'code': 'BUS401', 'grade': 'A', 'credits': 3, 'semester': 'Spring 2010'},
    {'code': 'MGT401', 'grade': 'A', 'credits': 3, 'semester': 'Spring 2010'},
    {'code': 'BUS498', 'grade': 'A', 'credits': 3, 'semester': 'Summer 2010'},
]

def get_grade_points(grade):
    return GRADE_POINTS.get(grade, 0.0)

def clean_grade(grade):
    if not grade:
        return None
    grade = str(grade).upper().strip()
    if grade in ['CR', 'W', 'I', 'Z']:
        return 'F'
    valid = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F']
    if grade in valid:
        return grade
    if grade.startswith('A'):
        return 'A'
    if grade.startswith('B'):
        return 'B'
    if grade.startswith('C'):
        return 'C'
    if grade == 'D':
        return 'D'
    if grade == 'F':
        return 'F'
    return None

def get_valid_courses(courses):
    return [c for c in courses if c.get('grade') and clean_grade(c.get('grade'))]

def total_credits(courses):
    valid = get_valid_courses(courses)
    total = 0.0
    for c in valid:
        credits = c.get('credits', 0)
        if credits:
            total += float(credits)
    return int(total)

def calculate_cgpa(courses):
    valid = get_valid_courses(courses)
    grade_points = 0.0
    credits = 0.0
    for c in valid:
        credits_val = float(c.get('credits', 0))
        if credits_val > 0:
            grade = clean_grade(c.get('grade'))
            grade_points += get_grade_points(grade) * credits_val
            credits += credits_val
    result = round(grade_points / credits, 2) if credits > 0 else 0.0
    return {'cgpa': result, 'credits': int(credits), 'gradePoints': round(grade_points, 2)}

def audit_courses(courses, program=None):
    program = program or PROGRAM
    valid = get_valid_courses(courses)
    completed = set(c['code'] for c in valid)

    missing = {
        'mandatoryGed': [c for c in program.get('mandatoryGed', []) if c not in completed],
        'coreMath': [c for c in program.get('coreMath', []) if c not in completed],
        'coreBusiness': [c for c in program.get('coreBusiness', []) if c not in completed],
        'majorCore': [c for c in program.get('majorCore', []) if c not in completed]
    }

    cgpa_data = calculate_cgpa(courses)
    total_creds = total_credits(courses)
    deficit = max(0, program.get('totalCredits', 120) - total_creds)

    eligible = cgpa_data['cgpa'] >= 2.0 and deficit <= 0 and not any(arr for arr in missing.values())

    return {
        'level1': {'totalCredits': total_creds, 'valid': len(valid)},
        'level2': {'cgpa': cgpa_data['cgpa'], 'credits': cgpa_data['credits'], 'gradePoints': cgpa_data['gradePoints']},
        'level3': {'eligible': eligible, 'creditDeficit': deficit, 'missingCourses': missing}
    }

def build_result(courses_data, audit_result):
    courses = courses_data.get('courses', [])
    student = courses_data.get('student', {})
    return {
        'student': {
            'name': student.get('name', 'NSU Student'),
            'id': student.get('id', '000000'),
            'degree': 'Bachelor of Business Administration (BBA)'
        },
        'audit': audit_result,
        'courses': courses
    }

def get_demo_result():
    audit = audit_courses(DEMO_COURSES)
    return build_result({'courses': DEMO_COURSES, 'student': {'name': 'Demo Student', 'id': '123456'}}, audit)