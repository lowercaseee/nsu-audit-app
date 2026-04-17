from dataclasses import dataclass, field
from typing import List, Dict


@dataclass
class Level1Result:
    total_credits: int
    valid_courses: int

    def to_dict(self) -> dict:
        return {
            'totalCredits': self.total_credits,
            'valid': self.valid_courses
        }


@dataclass
class Level2Result:
    cgpa: float
    credits: int
    grade_points: float = 0.0

    def to_dict(self) -> dict:
        return {
            'cgpa': self.cgpa,
            'credits': self.credits,
            'gradePoints': self.grade_points
        }


@dataclass
class Level3Result:
    eligible: bool
    credit_deficit: int
    missing_courses: Dict[str, List[str]]

    def to_dict(self) -> dict:
        return {
            'eligible': self.eligible,
            'creditDeficit': self.credit_deficit,
            'missingCourses': self.missing_courses
        }


@dataclass
class AuditResult:
    level1: Level1Result
    level2: Level2Result
    level3: Level3Result

    def to_dict(self) -> dict:
        return {
            'level1': self.level1.to_dict(),
            'level2': self.level2.to_dict(),
            'level3': self.level3.to_dict()
        }
