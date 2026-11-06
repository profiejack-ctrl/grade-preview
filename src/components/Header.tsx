import React from 'react';
import { useGrades } from '../context/GradesContext';
import { GraduationCap, LogOut, UserCheck, ShieldCheck, Smartphone, Monitor } from 'lucide-react';

interface HeaderProps {
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const Header: React.FC<HeaderProps> = ({ isMobileFrame, setIsMobileFrame }) => {
  const { currentUser, logout } = useGrades();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-sm sm:text-base text-slate-100">
                GradePulse
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                BCP Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Bestlink College of the Philippines • Computer Studies
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile frame toggle for desktop testing */}
          <button
            onClick={() => setIsMobileFrame(prev => !prev)}
            title={isMobileFrame ? "Switch to Full Screen View" : "Preview in Mobile Frame"}
            className="hidden md:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 transition active:scale-95"
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                <span>Desktop View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                <span>Mobile Frame</span>
              </>
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/70 text-xs">
                {currentUser.role === 'teacher' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="text-slate-300 font-medium max-w-[120px] truncate">
                  {currentUser.role === 'teacher' ? 'Faculty Portal' : currentUser.name.split(',')[0]}
                </span>
              </div>

              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
