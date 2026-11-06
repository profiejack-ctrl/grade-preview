import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Subject, User, StudentGradeRecord } from '../types';
import { INITIAL_SUBJECTS, DEMO_CREDENTIALS } from '../data/initialData';

interface GradesContextType {
  currentUser: User | null;
  subjects: Subject[];
  dbEngine: string;
  dbMessage?: string;
  login: (id: string, pass: string) => { success: boolean; message?: string };
  logout: () => void;
  addSubject: (newSubj: Omit<Subject, 'id' | 'uploadedAt'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  deleteSubject: (subjectId: string) => Promise<void>;
  resetToDefault: () => void;
  getStudentSubjects: (studentId: string) => { subject: Subject; record: StudentGradeRecord }[];
  getAllStudents: () => { studentId: string; name: string; section: string; sex: string }[];
  refreshData: () => Promise<void>;
}

const STORAGE_KEY_SUBJECTS = 'bcp_grade_viewer_subjects_v1';
const STORAGE_KEY_USER = 'bcp_grade_viewer_user_v1';
const STORAGE_KEY_PASSWORDS = 'bcp_grade_viewer_passwords_v1';

const GradesContext = createContext<GradesContextType | undefined>(undefined);

export const GradesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBJECTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed reading saved subjects:', e);
    }
    return INITIAL_SUBJECTS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dbEngine, setDbEngine] = useState<string>('sqlite');
  const [dbMessage, setDbMessage] = useState<string | undefined>(undefined);

  const [customPasswords, setCustomPasswords] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PASSWORDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed reading custom passwords:', e);
    }
    return {};
  });

  // Fetch centralized data from Neon / SQLite database
  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/subjects');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSubjects(data);
          try {
            localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(data));
          } catch (_) {}
        }
      }

      // Check active database engine (Neon Postgres vs SQLite)
      fetch('/api/health')
        .then(r => r.json())
        .then(h => {
          if (h.database) setDbEngine(h.database);
          if (h.message) setDbMessage(h.message);
        })
        .catch(() => {});
    } catch (e) {
      // Fallback to local state if server is offline
    }
  }, []);

  // Poll SQLite database for updates so mobile devices sync in real-time
  useEffect(() => {
    refreshData();

    const interval = setInterval(refreshData, 3500);
    const handleFocus = () => refreshData();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
    };
  }, [refreshData]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(subjects));
    } catch (e) {
      console.error('Failed saving subjects:', e);
    }
  }, [subjects]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch (e) {
      console.error('Failed saving user:', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PASSWORDS, JSON.stringify(customPasswords));
    } catch (e) {
      console.error('Failed saving passwords:', e);
    }
  }, [customPasswords]);

  const login = (id: string, pass: string): { success: boolean; message?: string } => {
    const cleanId = id.trim();
    const cleanPass = pass.trim();

    if (!cleanId) {
      return { success: false, message: 'Please enter your Student ID or Teacher Username' };
    }

    // Teacher login
    const isTeacherUser =
      cleanId.toLowerCase() === 'admin' ||
      cleanId.toLowerCase() === 'teacher' ||
      cleanId.toLowerCase() === DEMO_CREDENTIALS.teacher.username.toLowerCase();

    if (isTeacherUser) {
      const validPasswords = [
        DEMO_CREDENTIALS.teacher.password,
        'password123',
        'teacher',
        'admin',
        'admin123'
      ];
      if (validPasswords.includes(cleanPass)) {
        const teacherUser: User = {
          role: 'teacher',
          id: 'admin',
          name: DEMO_CREDENTIALS.teacher.name,
          course: 'College of Computer Studies - Faculty'
        };
        setCurrentUser(teacherUser);
        return { success: true };
      }
      return { success: false, message: 'Invalid password. Please check your credentials.' };
    }

    // Student Login: Default password is student_id itself, or custom password if changed
    const expectedPass = customPasswords[cleanId] || cleanId;
    
    // Find student in current subjects
    let studentName = '';
    let studentSection = 'BSIT 21001';

    for (const subj of subjects) {
      const rec = subj.records.find(r => r.studentId === cleanId);
      if (rec) {
        studentName = rec.name;
        studentSection = subj.section || studentSection;
        break;
      }
    }

    if (!studentName) {
      return {
        success: false,
        message: `Student ID "${cleanId}" not found in current records. Please verify or ask your instructor.`
      };
    }

    if (cleanPass !== expectedPass) {
      return {
        success: false,
        message: `Incorrect password. Default password is your Student ID (${cleanId}).`
      };
    }

    const studentUser: User = {
      role: 'student',
      id: cleanId,
      name: studentName,
      section: studentSection,
      course: 'Bachelor of Science in Information Technology'
    };
    setCurrentUser(studentUser);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addSubject = async (
    newSubj: Omit<Subject, 'id' | 'uploadedAt'>
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    const id = 'subj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const fullSubj: Subject = {
      ...newSubj,
      id,
      uploadedAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullSubj)
      });

      let errorMsg = `Server returned error (${res.status})`;
      let data: any = {};
      try {
        const text = await res.text();
        try {
          data = JSON.parse(text);
          errorMsg = data.details || data.error || errorMsg;
        } catch {
          if (text && text.length < 300) {
            errorMsg = text;
          }
        }
      } catch {}

      if (!res.ok || data.error) {
        throw new Error(errorMsg);
      }

      const savedId = data.id || id;
      const savedSubj: Subject = { ...fullSubj, id: savedId };

      setSubjects(prev => {
        const existingIndex = prev.findIndex(
          s => s.code.toUpperCase() === savedSubj.code.toUpperCase() && s.section === savedSubj.section
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = savedSubj;
          return updated;
        }
        return [savedSubj, ...prev];
      });

      await refreshData();
      return { success: true, id: savedId };
    } catch (err: any) {
      console.error('Failed saving subject to database:', err);
      return { success: false, error: err.message || 'Failed saving subject to database' };
    }
  };

  const deleteSubject = async (subjectId: string): Promise<void> => {
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    try {
      await fetch('/api/subjects/' + subjectId, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed deleting subject:', err);
    }
    await refreshData();
  };

  const resetToDefault = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.subjects) {
          setSubjects(data.subjects);
          setCustomPasswords({});
          return;
        }
      }
    } catch (e) {
      console.error('Failed resetting via API:', e);
    }

    setSubjects(INITIAL_SUBJECTS);
    setCustomPasswords({});
  };

  const getStudentSubjects = (studentId: string) => {
    const results: { subject: Subject; record: StudentGradeRecord }[] = [];
    for (const subj of subjects) {
      const rec = subj.records.find(r => r.studentId === studentId);
      if (rec) {
        results.push({ subject: subj, record: rec });
      }
    }
    return results;
  };

  const getAllStudents = () => {
    const map = new Map<string, { studentId: string; name: string; section: string; sex: string }>();
    for (const subj of subjects) {
      for (const rec of subj.records) {
        if (!map.has(rec.studentId)) {
          map.set(rec.studentId, {
            studentId: rec.studentId,
            name: rec.name,
            section: subj.section,
            sex: rec.sex
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  return (
    <GradesContext.Provider
      value={{
        currentUser,
        subjects,
        dbEngine,
        dbMessage,
        login,
        logout,
        addSubject,
        deleteSubject,
        resetToDefault,
        getStudentSubjects,
        getAllStudents,
        refreshData
      }}
    >
      {children}
    </GradesContext.Provider>
  );
};

export const useGrades = () => {
  const ctx = useContext(GradesContext);
  if (!ctx) throw new Error('useGrades must be used within a GradesProvider');
  return ctx;
};
