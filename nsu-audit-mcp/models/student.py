from dataclasses import dataclass, field
from typing import Optional, List
from .course import Course


@dataclass
class Student:
    name: str
    id: str
    dob: Optional[str] = None
    degree: Optional[str] = None
    courses: List[Course] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            'name': self.name,
            'id': self.id,
            'dob': self.dob,
            'degree': self.degree,
            'courses': [c.to_dict() for c in self.courses]
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Student':
        courses = []
        if 'courses' in data:
            courses = [Course.from_dict(c) for c in data['courses']]
        return cls(
            name=data.get('name', ''),
            id=data.get('id', ''),
            dob=data.get('dob'),
            degree=data.get('degree'),
            courses=courses
        )
