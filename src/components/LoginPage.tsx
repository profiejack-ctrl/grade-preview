import React, { useState } from 'react';
import { useGrades } from '../context/GradesContext';
import {
  GraduationCap,
  Shield,
  User,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, subjects } = useGrades();
  const [tab, setTab] = useState<'student' | 'teacher'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (newTab: 'student' | 'teacher') => {
    setTab(newTab);
    setError(null);
    setUsername('');
    setPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = login(username, password);
    if (!res.success && res.message) {
      setError(res.message);
    }
  };

  const totalStudents = Array.from(
    new Set(subjects.flatMap(s => s.records.map(r => r.studentId)))
  ).length;

  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
      {/* College Banner / Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-indigo-600/25 ring-4 ring-indigo-500/20 mb-3.5">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          Bestlink College of the Philippines
        </h1>
        <p className="text-xs text-indigo-400 font-semibold tracking-wider uppercase mt-1">
          College of Computer Studies • BSIT Portal
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Sign in to view your semestral grades or manage class grade records.
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 mb-5">
          <button
            type="button"
            onClick={() => handleTabChange('student')}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
              tab === 'student'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Student Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('teacher')}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
              tab === 'teacher'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Faculty Portal</span>
          </button>
        </div>

        {/* Student Instructions Only */}
        {tab === 'student' && (
          <div className="mb-4 px-3.5 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-300">
            <p className="font-semibold text-indigo-300 mb-0.5">Student Sign In</p>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Use your <strong>Student ID</strong> as both your username and password (e.g., <code className="text-indigo-300 font-mono font-bold">250102531</code>).
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {tab === 'student' ? 'Student ID Number' : 'Teacher Username'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={tab === 'student' ? 'e.g. 250102531' : 'Enter username'}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm text-slate-100 placeholder-slate-500 transition font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={tab === 'student' ? 'Default is Student ID' : 'Enter password'}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm text-slate-100 placeholder-slate-500 transition font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] cursor-pointer ${
              tab === 'student'
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
            }`}
          >
            <span>{tab === 'student' ? 'Sign In as Student' : 'Sign In as Faculty'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Database Status indicator */}
      <div className="mt-4 text-center">
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            {subjects.length} Subjects Loaded • {totalStudents} Enrolled Students
          </span>
        </p>
      </div>
    </div>
  );
};
