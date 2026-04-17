export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

export interface Student {
  name: string;
  id: string;
  dob: string;
  degree: string;
}

export interface Course {
  code: string;
  grade: string;
  credits: number;
  semester?: string;
}

export interface Level1Result {
  totalCredits: number;
  valid: number;
}

export interface Level2Result {
  cgpa: number;
  credits: number;
  gradePoints?: number;
}

export interface Level3Result {
  eligible: boolean;
  creditDeficit: number;
  missingCourses: {
    mandatoryGed: string[];
    coreMath: string[];
    coreBusiness: string[];
    majorCore: string[];
  };
}

export interface AuditResult {
  level1: Level1Result;
  level2: Level2Result;
  level3: Level3Result;
}

export interface TranscriptResult {
  student: Student;
  courses: Course[];
  summary: {
    totalCredits: number;
    cgpa: number;
    degreeCompleted: string;
  };
  audit: AuditResult;
  result: 'GRADUATED' | 'NOT GRADUATED';
  pdf?: string;
  certificate?: {
    filename: string;
    path: string;
    timestamp: string;
  };
}

export interface HistoryEntry {
  endpoint: string;
  user: string;
  timestamp: string;
  status: string;
}

export interface Certificate {
  filename: string;
  timestamp: string;
  size: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type RootStackParamList = {
  Login: undefined;
  Home: { user: User; token: string };
  Result: { result: TranscriptResult; token: string; user: User };
  History: { user: User; token: string };
  Certificates: { user: User; token: string };
  Settings: { user: User; token: string };
};