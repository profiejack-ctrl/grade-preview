import sqliteDb from './db.js';
import * as neonDb from './neonDb.js';

export function isUsingNeon() {
  return Boolean(process.env.DATABASE_URL);
}

export function isVercelWithoutDb() {
  return Boolean(process.env.VERCEL) && !process.env.DATABASE_URL;
}

export async function getAllSubjects() {
  if (isUsingNeon()) {
    const sql = neonDb.getNeonSql();
    return await neonDb.getAllNeonSubjects(sql);
  }
  return sqliteDb.getAllSubjects();
}

export async function saveSubject(subject) {
  if (isVercelWithoutDb()) {
    throw new Error(
      'DATABASE_URL is missing in your Vercel Project Settings! Please add your Neon connection string as DATABASE_URL in Vercel -> Settings -> Environment Variables so uploaded grades persist across all devices.'
    );
  }

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
  const vercelMissingDb = isVercelWithoutDb();

  try {
    const subjects = await getAllSubjects();
    return {
      status: vercelMissingDb ? 'warning' : 'ok',
      database: vercelMissingDb ? 'missing-database-url' : (isNeon ? 'neon-postgres' : 'sqlite'),
      isVercel: Boolean(process.env.VERCEL),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      message: vercelMissingDb
        ? 'DATABASE_URL is not set in Vercel Environment Variables. Cloud persistence is disabled.'
        : undefined,
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
