import * as neonDb from './neonDb.js';
import seedSubjects from './seedData.js';

let sqliteDb = null;
async function getSqlite() {
  if (process.env.VERCEL) return null;
  if (!sqliteDb) {
    try {
      const mod = await import('./db.js');
      sqliteDb = mod.default || mod;
    } catch (_) {
      sqliteDb = null;
    }
  }
  return sqliteDb;
}

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
    try {
      const sql = neonDb.getNeonSql(getDatabaseUrl());
      const neonSubjects = await neonDb.getAllNeonSubjects(sql);
      if (Array.isArray(neonSubjects) && neonSubjects.length > 0) {
        return neonSubjects;
      }
    } catch (err) {
      console.error('Neon getAllSubjects error:', err);
    }
    return seedSubjects;
  }

  const sqlite = await getSqlite();
  if (sqlite) {
    try {
      const local = sqlite.getAllSubjects();
      if (Array.isArray(local) && local.length > 0) return local;
    } catch (_) {}
  }

  return seedSubjects;
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

  const sqlite = await getSqlite();
  if (sqlite) {
    return sqlite.saveSubject(subject);
  }

  throw new Error('No persistent database configured');
}

export async function deleteSubject(id) {
  if (isUsingNeon()) {
    const sql = neonDb.getNeonSql(getDatabaseUrl());
    return await neonDb.deleteNeonSubject(sql, id);
  }

  const sqlite = await getSqlite();
  if (sqlite) {
    return sqlite.deleteSubject(id);
  }
}

export async function resetDatabase() {
  if (isUsingNeon()) {
    const sql = neonDb.getNeonSql(getDatabaseUrl());
    await neonDb.clearAllNeon(sql);
    return await neonDb.getAllNeonSubjects(sql);
  }

  const sqlite = await getSqlite();
  if (sqlite) {
    sqlite.clearAll();
    return sqlite.getAllSubjects();
  }

  return seedSubjects;
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
