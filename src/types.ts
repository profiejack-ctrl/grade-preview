export interface StudentGradeRecord {
  no: number;
  studentId: string;
  name: string;
  sex: 'Male' | 'Female' | string;
  prelimScore: number;
  prelimWeighted: number;
  midtermScore: number;
  midtermWeighted: number;
  finalsScore: number;
  finalsWeighted: number;
  average: number;
  equivalent: number;
  remarks: 'Passed' | 'Failed' | string;
}

export interface Subject {
  id: string;
  code: string;
  title: string;
  section: string;
  units: number;
  semester: string;
  academicYear: string;
  instructor: string;
  programHead?: string;
  institution?: string;
  college?: string;
  gradingSystem?: string;
  uploadedAt: string;
  records: StudentGradeRecord[];
}

export interface User {
  role: 'student' | 'teacher';
  id: string;
  name: string;
  section?: string;
  course?: string;
}

export interface ExtractedPdfSummary {
  subjectTitle: string;
  subjectCode: string;
  section: string;
  units: number;
  semester: string;
  academicYear: string;
  instructor: string;
  programHead: string;
  records: StudentGradeRecord[];
  rawTextSample?: string;
}
