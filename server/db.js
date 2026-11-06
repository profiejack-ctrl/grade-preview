import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

try {
  const sqlite = await import('node:sqlite');
  if (sqlite && sqlite.DatabaseSync) {
    const DATA_DIR = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (_) {}
    }
    const DB_PATH = path.join(DATA_DIR, 'grades.sqlite');
    db = new sqlite.DatabaseSync(DB_PATH);

    // Enable WAL mode and foreign keys
    db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        title TEXT NOT NULL,
        section TEXT NOT NULL,
        units INTEGER NOT NULL DEFAULT 3,
        semester TEXT NOT NULL DEFAULT '1st Semester',
        academic_year TEXT NOT NULL DEFAULT '2026-2027',
        instructor TEXT NOT NULL,
        program_head TEXT,
        institution TEXT DEFAULT 'Bestlink College of the Philippines',
        college TEXT DEFAULT 'College Computer Studies',
        grading_system TEXT DEFAULT 'Professional Subjects (*Laboratory)',
        uploaded_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS student_grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        no INTEGER,
        student_id TEXT NOT NULL,
        name TEXT NOT NULL,
        sex TEXT NOT NULL,
        prelim_score REAL NOT NULL,
        prelim_weighted REAL NOT NULL,
        midterm_score REAL NOT NULL,
        midterm_weighted REAL NOT NULL,
        finals_score REAL NOT NULL,
        finals_weighted REAL NOT NULL,
        average REAL NOT NULL,
        equivalent REAL NOT NULL,
        remarks TEXT NOT NULL,
        UNIQUE(subject_id, student_id)
      );

      CREATE INDEX IF NOT EXISTS idx_student_grades_sid ON student_grades(student_id);
      CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
    `);
  }
} catch (e) {
  // node:sqlite is not supported on this platform/Node runtime (e.g. Vercel)
  db = null;
}

export function getAllSubjects() {
  if (!db) return [];
  const subjectRows = db.prepare('SELECT * FROM subjects ORDER BY uploaded_at DESC').all();
  const selectGrades = db.prepare('SELECT * FROM student_grades WHERE subject_id = ? ORDER BY no ASC');

  return subjectRows.map(row => {
    const grades = selectGrades.all(row.id);
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      section: row.section,
      units: row.units,
      semester: row.semester,
      academicYear: row.academic_year,
      instructor: row.instructor,
      programHead: row.program_head,
      institution: row.institution,
      college: row.college,
      gradingSystem: row.grading_system,
      uploadedAt: row.uploaded_at,
      records: grades.map(g => ({
        no: g.no,
        studentId: g.student_id,
        name: g.name,
        sex: g.sex,
        prelimScore: g.prelim_score,
        prelimWeighted: g.prelim_weighted,
        midtermScore: g.midterm_score,
        midtermWeighted: g.midterm_weighted,
        finalsScore: g.finals_score,
        finalsWeighted: g.finals_weighted,
        average: g.average,
        equivalent: g.equivalent,
        remarks: g.remarks
      }))
    };
  });
}

export function saveSubject(subject) {
  if (!db) throw new Error('SQLite database is unavailable in this environment');

  const insertSubj = db.prepare(`
    INSERT INTO subjects (
      id, code, title, section, units, semester, academic_year,
      instructor, program_head, institution, college, grading_system, uploaded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      code = excluded.code,
      title = excluded.title,
      section = excluded.section,
      units = excluded.units,
      semester = excluded.semester,
      academic_year = excluded.academic_year,
      instructor = excluded.instructor,
      program_head = excluded.program_head,
      institution = excluded.institution,
      college = excluded.college,
      grading_system = excluded.grading_system,
      uploaded_at = excluded.uploaded_at
  `);

  const id = subject.id || ('subj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));
  const uploadedAt = subject.uploadedAt || new Date().toISOString();

  insertSubj.run(
    id,
    subject.code,
    subject.title,
    subject.section || 'BSIT 21001',
    subject.units || 3,
    subject.semester || '1st Semester',
    subject.academicYear || '2026-2027',
    subject.instructor || 'Prof. Romel Bernabe Cabiling',
    subject.programHead || 'Rommel Jaraba Constantino DIT',
    subject.institution || 'Bestlink College of the Philippines',
    subject.college || 'College Computer Studies',
    subject.gradingSystem || 'Professional Subjects (*Laboratory)',
    uploadedAt
  );

  // Replace records
  db.prepare('DELETE FROM student_grades WHERE subject_id = ?').run(id);

  const insertGrade = db.prepare(`
    INSERT INTO student_grades (
      subject_id, no, student_id, name, sex,
      prelim_score, prelim_weighted, midterm_score, midterm_weighted,
      finals_score, finals_weighted, average, equivalent, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  if (Array.isArray(subject.records)) {
    for (const rec of subject.records) {
      insertGrade.run(
        id,
        rec.no || 0,
        rec.studentId,
        rec.name,
        rec.sex || 'Male',
        rec.prelimScore || 0,
        rec.prelimWeighted || 0,
        rec.midtermScore || 0,
        rec.midtermWeighted || 0,
        rec.finalsScore || 0,
        rec.finalsWeighted || 0,
        rec.average || 0,
        rec.equivalent || 5.0,
        rec.remarks || 'Passed'
      );
    }
  }

  return id;
}

export function deleteSubject(subjectId) {
  if (!db) return;
  db.prepare('DELETE FROM subjects WHERE id = ?').run(subjectId);
}

export function clearAll() {
  if (!db) return;
  db.exec(`
    DELETE FROM student_grades;
    DELETE FROM subjects;
  `);
}

export default {
  getAllSubjects,
  saveSubject,
  deleteSubject,
  clearAll
};
