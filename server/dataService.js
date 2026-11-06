import sqliteDb from './db.js';
import * as neonDb from './neonDb.js';

export function isUsingNeon() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getAllSubjects() {
  if (isUsingNeon()) {
    const sql = neonDb.getNeonSql();
    return await neonDb.getAllNeonSubjects(sql);
  }
  return sqliteDb.getAllSubjects();
}

export async function saveSubject(subject) {
  if (isUsingNeon()) {
    const sql = neonDb.getNeonSql();
    await neonDb.ensureNeonSchema(sql);
    return await neonDb.saveNeonSubject(sql, subject);
  }
  return sqliteDb.saveSubject(subject);
}

export async function deleteSubject(id) {
  if (isUsingNeon()) {
    const sql = neonDb.getNeonSql();
    return await neonDb.deleteNeonSubject(sql, id);
  }
  return sqliteDb.deleteSubject(id);
}

export async function resetDatabase() {
  if (isUsingNeon()) {
    const sql = neonDb.getNeonSql();
    await neonDb.clearAllNeon(sql);
    return await neonDb.getAllNeonSubjects(sql);
  }
  sqliteDb.clearAll();
  return sqliteDb.getAllSubjects();
}

export async function getDbHealth() {
  const isNeon = isUsingNeon();
  try {
    const subjects = await getAllSubjects();
    return {
      status: 'ok',
      database: isNeon ? 'neon-postgres' : 'sqlite',
      subjectCount: subjects.length,
      subjects: subjects.map(s => ({
        code: s.code,
        title: s.title,
        students: s.records ? s.records.length : 0
      }))
    };
  } catch (err) {
    return {
      status: 'error',
      database: isNeon ? 'neon-postgres' : 'sqlite',
      error: err.message
    };
  }
}
