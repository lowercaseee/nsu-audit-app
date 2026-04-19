"""
NSU Audit Services - All in one file for simplicity
"""

GRADE_POINTS = {'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'D': 1.0, 'F': 0.0}
NON_EARNING = ['F', 'W', 'I', 'Z']

PROGRAM = {
    'totalCredits': 120,
    'mandatoryGed': ['ENG102', 'ENG103'],
    'coreMath': ['ECO172'],
    'coreBusiness': ['ACT201', 'ACT202'],
    'majorCore': ['FIN254', 'FIN433']
}

DEMO_DATA = {
    'name': 'Rubayat Sarwar Chowdhury',
    'id': '071415030',
    'dob': '03 Jun 1989',
    'degree': 'Bachelor of Business Administration',
    'courses': [
        {'code': 'ACT201', 'grade': 'A-', 'credits': 3.0, 'semester': 'Spring 2007'},
        {'code': 'ENG102', 'grade': 'B+', 'credits': 3.0, 'semester': 'Spring 2007'},
        {'code': 'MIS101', 'grade': 'B+', 'credits': 3.0, 'semester': 'Spring 2007'},
        {'code': 'ACT201', 'grade': 'A-', 'credits': 3.0, 'semester': 'Summer 2007'},
        {'code': 'BUS101', 'grade': 'A-', 'credits': 3.0, 'semester': 'Summer 2007'},
        {'code': 'MIS201', 'grade': 'A', 'credits': 3.0, 'semester': 'Summer 2007'},
        {'code': 'ACT202', 'grade': 'B-', 'credits': 3.0, 'semester': 'Fall 2007'},
        {'code': 'MGT210', 'grade': 'A', 'credits': 3.0, 'semester': 'Fall 2007'},
        {'code': 'ECO172', 'grade': 'B+', 'credits': 3.0, 'semester': 'Spring 2008'},
        {'code': 'ENG103', 'grade': 'A+', 'credits': 3.0, 'semester': 'Spring 2008'},
        {'code': 'MKT202', 'grade': 'A-', 'credits': 3.0, 'semester': 'Spring 2008'},
        {'code': 'ECO164', 'grade': 'B+', 'credits': 3.0, 'semester': 'Fall 2008'},
        {'code': 'ECO134', 'grade': 'B+', 'credits': 3.0, 'semester': 'Fall 2008'},
        {'code': 'ECO173', 'grade': 'B-', 'credits': 3.0, 'semester': 'Fall 2008'},
        {'code': 'FIN254', 'grade': 'B+', 'credits': 3.0, 'semester': 'Fall 2008'},
        {'code': 'LAW200', 'grade': 'B', 'credits': 3.0, 'semester': 'Fall 2008'},
        {'code': 'ACT330', 'grade': 'C', 'credits': 3.0, 'semester': 'Fall 2009'},
        {'code': 'BUS251', 'grade': 'B-', 'credits': 3.0, 'semester': 'Fall 2009'},
        {'code': 'FIN433', 'grade': 'B+', 'credits': 3.0, 'semester': 'Fall 2009'},
        {'code': 'BIO103', 'grade': 'A', 'credits': 3.0, 'semester': 'Spring 2010'},
        {'code': 'BUS401', 'grade': 'B', 'credits': 3.0, 'semester': 'Spring 2010'},
        {'code': 'FIN435', 'grade': 'B+', 'credits': 3.0, 'semester': 'Spring 2010'},
        {'code': 'MGT314', 'grade': 'B', 'credits': 3.0, 'semester': 'Spring 2010'},
        {'code': 'ENG105', 'grade': 'B+', 'credits': 3.0, 'semester': 'Summer 2010'},
        {'code': 'FIN599A', 'grade': 'A', 'credits': 3.0, 'semester': 'Summer 2010'},
        {'code': 'ACT322', 'grade': 'A', 'credits': 3.0, 'semester': 'Fall 2010'},
        {'code': 'BUS498', 'grade': 'B+', 'credits': 4.0, 'semester': 'Spring 2011'},
    ]
}


def clean_grade(grade):
    if not grade:
        return None
    grade = grade.upper().strip()
    if grade in ['Cr', 'W', 'I', 'Z']:
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
    return [c for c in courses if c.get('grade') and clean_grade(c.get('grade')) not in NON_EARNING]


def total_credits(courses):
    valid = get_valid_courses(courses)
    return sum(int(c.get('credits', 0) or 0) for c in valid)


def calculate_cgpa(courses):
    valid = get_valid_courses(courses)
    grade_points = 0.0
    credits = 0
    for c in valid:
        credits_val = c.get('credits', 0) or 0
        if credits_val > 0:
            grade = clean_grade(c.get('grade'))
            grade_points += GRADE_POINTS.get(grade, 0.0) * credits_val
            credits += credits_val
    result = round(grade_points / credits, 2) if credits > 0 else 0.0
    return {'cgpa': result, 'credits': credits, 'gradePoints': round(grade_points, 2)}


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
    credits = total_credits(courses)
    deficit = max(0, program.get('totalCredits', 120) - credits)

    eligible = (
        cgpa_data['cgpa'] >= 2.0 and
        deficit <= 0 and
        not any(arr for arr in missing.values())
    )

    return {
        'level1': {'totalCredits': credits, 'valid': len(valid)},
        'level2': {'cgpa': cgpa_data['cgpa'], 'credits': cgpa_data['credits'], 'gradePoints': cgpa_data['gradePoints']},
        'level3': {'eligible': eligible, 'creditDeficit': deficit, 'missingCourses': missing}
    }


def build_result(courses_data, audit_result):
    return {
        'student': {
            'name': courses_data.get('name', 'Test Student'),
            'id': courses_data.get('id', '000000000'),
            'dob': courses_data.get('dob', 'N/A'),
            'degree': courses_data.get('degree', 'Bachelor of Business Administration')
        },
        'courses': courses_data.get('courses', []),
        'summary': {
            'totalCredits': audit_result.get('level1', {}).get('totalCredits', 0),
            'cgpa': audit_result.get('level2', {}).get('cgpa', 0),
            'degreeCompleted': courses_data.get('summary', {}).get('degreeCompleted', 'N/A')
        },
        'audit': audit_result,
        'result': 'GRADUATED' if audit_result.get('level3', {}).get('eligible') else 'NOT GRADUATED'
    }


def get_demo_result():
    audit = audit_courses(DEMO_DATA['courses'])
    return build_result(DEMO_DATA, audit)