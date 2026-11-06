import { neon } from '@neondatabase/serverless';
import seedSubjects from './seedData.js';

let isSchemaInitialized = false;

export function getNeonSql(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }
  return neon(connectionString);
}

export async function ensureNeonSchema(sql) {
  if (isSchemaInitialized) return;

  await sql`
    CREATE TABLE IF NOT EXISTS subjects (
      id VARCHAR(100) PRIMARY KEY,
      code VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      section VARCHAR(50) NOT NULL,
      units INTEGER NOT NULL DEFAULT 3,
      semester VARCHAR(50) NOT NULL DEFAULT '1st Semester',
      academic_year VARCHAR(50) NOT NULL DEFAULT '2026-2027',
      instructor VARCHAR(255) NOT NULL,
      program_head VARCHAR(255),
      institution VARCHAR(255) DEFAULT 'Bestlink College of the Philippines',
      college VARCHAR(255) DEFAULT 'College Computer Studies',
      grading_system VARCHAR(255) DEFAULT 'Professional Subjects (*Laboratory)',
      uploaded_at VARCHAR(100) NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS student_grades (
      id SERIAL PRIMARY KEY,
      subject_id VARCHAR(100) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      no INTEGER,
      student_id VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      sex VARCHAR(20) NOT NULL,
      prelim_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
      prelim_weighted NUMERIC(6, 2) NOT NULL DEFAULT 0,
      midterm_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
      midterm_weighted NUMERIC(6, 2) NOT NULL DEFAULT 0,
      finals_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
      finals_weighted NUMERIC(6, 2) NOT NULL DEFAULT 0,
      average NUMERIC(6, 2) NOT NULL DEFAULT 0,
      equivalent NUMERIC(4, 2) NOT NULL DEFAULT 5.0,
      remarks VARCHAR(50) NOT NULL DEFAULT 'Passed',
      UNIQUE(subject_id, student_id)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_student_grades_sid ON student_grades(student_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code)`;

  // Seed if empty
  const countRes = await sql`SELECT count(*)::int as total FROM subjects`;
  if (countRes[0]?.total === 0) {
    console.log('Neon database empty, seeding initial subjects...');
    for (const subj of seedSubjects) {
      await saveNeonSubject(sql, subj);
    }
  }

  isSchemaInitialized = true;
}

export async function getAllNeonSubjects(sql) {
  await ensureNeonSchema(sql);

  const subjectRows = await sql`
    SELECT * FROM subjects ORDER BY uploaded_at DESC
  `;

  if (subjectRows.length === 0) return [];

  const gradeRows = await sql`
    SELECT * FROM student_grades ORDER BY no ASC
  `;

  const gradesBySubject = new Map();
  for (const g of gradeRows) {
    if (!gradesBySubject.has(g.subject_id)) {
      gradesBySubject.set(g.subject_id, []);
    }
    gradesBySubject.get(g.subject_id).push({
      no: g.no,
      studentId: g.student_id,
      name: g.name,
      sex: g.sex,
      prelimScore: Number(g.prelim_score),
      prelimWeighted: Number(g.prelim_weighted),
      midtermScore: Number(g.midterm_score),
      midtermWeighted: Number(g.midterm_weighted),
      finalsScore: Number(g.finals_score),
      finalsWeighted: Number(g.finals_weighted),
      average: Number(g.average),
      equivalent: Number(g.equivalent),
      remarks: g.remarks
    });
  }

  return subjectRows.map(row => ({
    id: row.id,
    code: row.code,
    title: row.title,
    section: row.section,
    units: Number(row.units),
    semester: row.semester,
    academicYear: row.academic_year,
    instructor: row.instructor,
    programHead: row.program_head,
    institution: row.institution,
    college: row.college,
    gradingSystem: row.grading_system,
    uploadedAt: row.uploaded_at,
    records: gradesBySubject.get(row.id) || []
  }));
}

export async function saveNeonSubject(sql, subject) {
  // Check if subject with this code & section already exists to prevent duplicate entries
  const existing = await sql`
    SELECT id FROM subjects
    WHERE UPPER(code) = UPPER(${subject.code}) AND section = ${subject.section || 'BSIT 21001'}
    LIMIT 1
  `;

  const id = subject.id || (existing[0]?.id) || ('subj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));
  const uploadedAt = subject.uploadedAt || new Date().toISOString();

  await sql`
    INSERT INTO subjects (
      id, code, title, section, units, semester, academic_year,
      instructor, program_head, institution, college, grading_system, uploaded_at
    ) VALUES (
      ${id},
      ${subject.code},
      ${subject.title},
      ${subject.section || 'BSIT 21001'},
      ${subject.units || 3},
      ${subject.semester || '1st Semester'},
      ${subject.academicYear || '2026-2027'},
      ${subject.instructor || 'Prof. Romel Bernabe Cabiling'},
      ${subject.programHead || 'Rommel Jaraba Constantino DIT'},
      ${subject.institution || 'Bestlink College of the Philippines'},
      ${subject.college || 'College Computer Studies'},
      ${subject.gradingSystem || 'Professional Subjects (*Laboratory)'},
      ${uploadedAt}
    )
    ON CONFLICT (id) DO UPDATE SET
      code = EXCLUDED.code,
      title = EXCLUDED.title,
      section = EXCLUDED.section,
      units = EXCLUDED.units,
      semester = EXCLUDED.semester,
      academic_year = EXCLUDED.academic_year,
      instructor = EXCLUDED.instructor,
      program_head = EXCLUDED.program_head,
      institution = EXCLUDED.institution,
      college = EXCLUDED.college,
      grading_system = EXCLUDED.grading_system,
      uploaded_at = EXCLUDED.uploaded_at
  `;

  await sql`DELETE FROM student_grades WHERE subject_id = ${id}`;

  if (Array.isArray(subject.records) && subject.records.length > 0) {
    const params = [];
    const rowPlaceholders = [];

    for (let i = 0; i < subject.records.length; i++) {
      const rec = subject.records[i];
      const offset = i * 14;
      rowPlaceholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14})`
      );
      params.push(
        id,
        rec.no || (i + 1),
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

    const batchQuery = `
      INSERT INTO student_grades (
        subject_id, no, student_id, name, sex,
        prelim_score, prelim_weighted, midterm_score, midterm_weighted,
        finals_score, finals_weighted, average, equivalent, remarks
      ) VALUES ${rowPlaceholders.join(', ')}
    `;

    await sql(batchQuery, params);
  }

  return id;
}

export async function deleteNeonSubject(sql, id) {
  await sql`DELETE FROM subjects WHERE id = ${id}`;
}

export async function clearAllNeon(sql) {
  await sql`DELETE FROM student_grades`;
  await sql`DELETE FROM subjects`;
  for (const subj of seedSubjects) {
    await saveNeonSubject(sql, subj);
  }
}
