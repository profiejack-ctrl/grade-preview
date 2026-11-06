import React, { useState } from 'react';
import { GradesProvider, useGrades } from './context/GradesContext';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { StudentPortal } from './components/StudentPortal';
import { TeacherPortal } from './components/TeacherPortal';
import { BottomNav } from './components/BottomNav';
import { Smartphone, Monitor, ShieldCheck, GraduationCap } from 'lucide-react';

const MainContent: React.FC<{ isMobileFrame: boolean; setIsMobileFrame: React.Dispatch<React.SetStateAction<boolean>> }> = ({
  isMobileFrame,
  setIsMobileFrame
}) => {
  const { currentUser, login } = useGrades();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header isMobileFrame={isMobileFrame} setIsMobileFrame={setIsMobileFrame} />

      {/* Main Container */}
      <main className="flex-1 pb-16 sm:pb-8">
        {!currentUser ? (
          <LoginPage />
        ) : currentUser.role === 'teacher' ? (
          <TeacherPortal />
        ) : (
          <StudentPortal />
        )}
      </main>

      {currentUser && <BottomNav />}
    </div>
  );
};

export function App() {
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  return (
    <GradesProvider>
      {isMobileFrame ? (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-2 sm:p-6">
          <div className="mb-3 text-center hidden md:block">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Simulated Mobile Device Frame (iPhone 16 / 390px width)</span>
              <button
                onClick={() => setIsMobileFrame(false)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline ml-1"
              >
                Switch to Fluid Desktop
              </button>
            </div>
          </div>

          {/* Smartphone device chassis */}
          <div className="w-full max-w-[400px] h-[860px] bg-slate-900 rounded-[48px] p-3 shadow-2xl shadow-indigo-950/40 ring-1 ring-slate-800 ring-offset-4 ring-offset-slate-950 flex flex-col relative overflow-hidden border border-slate-700/60">
            {/* Speaker & Dynamic island */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900/80 mr-2" />
              <div className="w-2 h-2 rounded-full bg-slate-800" />
            </div>

            {/* Inner Screen */}
            <div className="w-full h-full rounded-[38px] overflow-y-auto bg-slate-950 relative pt-4 flex flex-col">
              <MainContent isMobileFrame={isMobileFrame} setIsMobileFrame={setIsMobileFrame} />
            </div>

            {/* Home indicator bar */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full z-40 pointer-events-none" />
          </div>
        </div>
      ) : (
        <MainContent isMobileFrame={isMobileFrame} setIsMobileFrame={setIsMobileFrame} />
      )}
    </GradesProvider>
  );
}

export default App;
