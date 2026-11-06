import sqliteDb from './db.js';
import * as neonDb from './neonDb.js';

export function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL ||
    ''
  ).trim();
}

export function isUsingNeon() {
  return Boolean(getDatabaseUrl());
}

export function isVercelWithoutDb() {
  return Boolean(process.env.VERCEL) && !isUsingNeon();
}

export async function getAllSubjects() {
  if (isUsingNeon()) {
    const sql = neonDb.getNeonSql(getDatabaseUrl());
    return await neonDb.getAllNeonSubjects(sql);
  }
  return sqliteDb.getAllSubjects();
}

export async function saveSubject(subject) {
  if (isVercelWithoutDb()) {
    throw new Error(
      'DATABASE_URL is missing or marked "Needs Attention" in your Vercel Project Settings! Please ensure DATABASE_URL has a value for Production and Redeploy.'
    );
  }

  if (isUsingNeon()) {
    const sql = neonDb.getNeonSql(getDatabaseUrl());
    await neonDb.ensureNeonSchema(sql);
    return await neonDb.saveNeonSubject(sql, subject);
  }
  return sqliteDb.saveSubject(subject);
}

export async function deleteSubject(id) {
  if (isUsingNeon()) {
    const sql = neonDb.getNeonSql(getDatabaseUrl());
    return await neonDb.deleteNeonSubject(sql, id);
  }
  return sqliteDb.deleteSubject(id);
}

export async function resetDatabase() {
  if (isUsingNeon()) {
    const sql = neonDb.getNeonSql(getDatabaseUrl());
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
      hasDatabaseUrl: isNeon,
      message: vercelMissingDb
        ? 'DATABASE_URL is marked Needs Attention or not assigned to Production in Vercel Environment Variables.'
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
