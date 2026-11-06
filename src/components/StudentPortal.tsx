import React, { useState } from 'react';
import { useGrades } from '../context/GradesContext';
import { Subject, StudentGradeRecord } from '../types';
import { SubjectDetailModal } from './SubjectDetailModal';
import { GradeSlipModal } from './GradeSlipModal';
import {
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  FileText,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Search,
  Sparkles
} from 'lucide-react';

export const StudentPortal: React.FC = () => {
  const { currentUser, getStudentSubjects, getAllStudents, login } = useGrades();
  const [selectedItem, setSelectedItem] = useState<{ subject: Subject; record: StudentGradeRecord } | null>(null);
  const [showGradeSlip, setShowGradeSlip] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentUser) return null;

  const enrolled = getStudentSubjects(currentUser.id);
  const allStudents = getAllStudents();

  // Metrics computation
  let totalWeightedScore = 0;
  let totalUnits = 0;
  let passedUnits = 0;
  let hasFailedSubject = false;

  enrolled.forEach(({ subject, record }) => {
    totalWeightedScore += record.average * subject.units;
    totalUnits += subject.units;
    if (record.remarks === 'Passed') {
      passedUnits += subject.units;
    } else {
      hasFailedSubject = true;
    }
  });

  const gwa = totalUnits > 0 ? (totalWeightedScore / totalUnits).toFixed(2) : '0.00';
  const gwaNum = parseFloat(gwa);

  // Standing calculation
  let standingTitle = 'Regular Standing';
  let standingColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (hasFailedSubject) {
    standingTitle = 'Academic Deficiency';
    standingColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  } else if (gwaNum >= 92) {
    standingTitle = "Dean's List Eligible";
    standingColor = 'text-amber-300 bg-amber-500/10 border-amber-500/20';
  }

  const filteredEnrolled = enrolled.filter(
    ({ subject }) =>
      subject.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-4">
      {/* Student Profile Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl shadow-black/30 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-indigo-600/20 ring-2 ring-white/10">
              {currentUser.name
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight leading-snug">
                {currentUser.name}
              </h2>
              <p className="text-xs text-indigo-400 font-mono font-medium">
                ID: {currentUser.id}
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${standingColor}`}>
            {standingTitle}
          </span>
        </div>

        {/* Academic Details row */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Section</span>
            <span className="font-semibold text-slate-200">{currentUser.section || 'BSIT 21001'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Term</span>
            <span className="font-semibold text-slate-200">1st Sem, 2026-2027</span>
          </div>
        </div>
      </div>

      {/* GWA Performance Summary Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Academic Performance
            </h3>
          </div>
          <button
            onClick={() => setShowGradeSlip(true)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Grade Slip</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-center">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">
              GWA
            </span>
            <span className="text-xl font-extrabold font-mono text-white">
              {gwa}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">
              Subjects
            </span>
            <span className="text-xl font-extrabold font-mono text-indigo-400">
              {enrolled.length}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">
              Units Passed
            </span>
            <span className="text-xl font-extrabold font-mono text-emerald-400">
              {passedUnits}/{totalUnits}
            </span>
          </div>
        </div>
      </div>

      {/* Subject List Section */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Enrolled Subjects ({enrolled.length})</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">Tap card for breakdown</span>
        </div>

        {/* Search bar if multiple subjects */}
        {enrolled.length > 2 && (
          <div className="mb-3 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search subject title or code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500"
            />
          </div>
        )}

        {enrolled.length === 0 ? (
          <div className="text-center p-8 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 text-xs">
            No enrolled subjects found for Student ID {currentUser.id}. Ask your teacher to upload your grade sheet.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEnrolled.map(({ subject, record }) => {
              const isPassed = record.remarks === 'Passed';
              return (
                <div
                  key={subject.id}
                  onClick={() => setSelectedItem({ subject, record })}
                  className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-4 transition cursor-pointer active:scale-[0.99] group shadow-md shadow-black/20"
                >
                  {/* Top: Code & Units */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold text-xs">
                        {subject.code}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {subject.units}.0 Units
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        isPassed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {record.remarks}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-white transition leading-snug">
                    {subject.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {subject.instructor}
                  </p>

                  {/* Periodical breakdown pills */}
                  <div className="mt-3 grid grid-cols-3 gap-1.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800/60 text-center font-mono">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-sans">Prelim</span>
                      <span className="text-xs font-semibold text-slate-300">{record.prelimScore}</span>
                      <span className="text-[9px] text-indigo-400 block font-sans">({record.prelimWeighted}%)</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-sans">Midterm</span>
                      <span className="text-xs font-semibold text-slate-300">{record.midtermScore}</span>
                      <span className="text-[9px] text-indigo-400 block font-sans">({record.midtermWeighted}%)</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-sans">Finals</span>
                      <span className="text-xs font-semibold text-slate-300">{record.finalsScore}</span>
                      <span className="text-[9px] text-indigo-400 block font-sans">({record.finalsWeighted}%)</span>
                    </div>
                  </div>

                  {/* Bottom: Final average & equivalent */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Final Grade</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-extrabold font-mono text-white">
                          {record.average.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400">
                          (Equiv: <span className="text-slate-200 font-semibold">{record.equivalent.toFixed(2)}</span>)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition">
                      <span>Breakdown</span>
                      <ChevronRight className="w-4 h-4 ml-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <SubjectDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {showGradeSlip && (
        <GradeSlipModal
          studentId={currentUser.id}
          onClose={() => setShowGradeSlip(false)}
        />
      )}
    </div>
  );
};
