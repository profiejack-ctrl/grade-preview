import React from 'react';
import { useGrades } from '../context/GradesContext';
import { GraduationCap, Shield, LogOut, BookOpen, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentUser, logout } = useGrades();

  if (!currentUser) return null;

  const isTeacher = currentUser.role === 'teacher';

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 px-6 py-2.5 sm:hidden">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
            isTeacher
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
          }`}>
            {isTeacher ? <Shield className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200 truncate max-w-[170px]">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              {isTeacher ? 'Faculty Session' : `ID: ${currentUser.id}`}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-xs font-semibold transition active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
