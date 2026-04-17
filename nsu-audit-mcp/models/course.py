from dataclasses import dataclass
from typing import Optional


@dataclass
class Course:
    code: str
    grade: str
    credits: float
    semester: Optional[str] = ""

    GRADE_POINTS = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'D': 1.0, 'F': 0.0
    }

    NON_EARNING = ['F', 'W', 'I', 'Z']

    def is_valid(self) -> bool:
        return self.grade not in self.NON_EARNING

    def grade_point(self) -> float:
        return self.GRADE_POINTS.get(self.grade.upper(), 0.0)

    def quality_points(self) -> float:
        return self.grade_point() * self.credits

    @classmethod
    def clean_grade(cls, grade: str) -> Optional[str]:
        if not grade:
            return None
        grade = grade.upper().strip()
        if grade in ['Cr', 'W', 'I', 'Z']:
            return 'F'
        valid_grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F']
        if grade in valid_grades:
            return grade
        if grade.startswith('A') and len(grade) <= 2:
            return 'A'
        if grade.startswith('B') and len(grade) <= 2:
            return 'B'
        if grade.startswith('C') and len(grade) <= 2:
            return 'C'
        if grade == 'D':
            return 'D'
        if grade == 'F':
            return 'F'
        return None

    def to_dict(self) -> dict:
        return {
            'code': self.code,
            'grade': self.grade,
            'credits': self.credits,
            'semester': self.semester
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Course':
        return cls(
            code=data.get('code', ''),
            grade=data.get('grade', 'F'),
            credits=float(data.get('credits', 0)),
            semester=data.get('semester', '')
        )