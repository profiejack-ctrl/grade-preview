import React from 'react';
import { Subject, StudentGradeRecord } from '../types';
import { X, Award, BookOpen, User, Calendar, CheckCircle2, XCircle, Info } from 'lucide-react';

interface SubjectDetailModalProps {
  item: { subject: Subject; record: StudentGradeRecord } | null;
  onClose: () => void;
}

export const SubjectDetailModal: React.FC<SubjectDetailModalProps> = ({ item, onClose }) => {
  if (!item) return null;
  const { subject, record } = item;
  const isPassed = record.remarks === 'Passed';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black p-5 text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {subject.code}
            </span>
            <span className="text-xs text-slate-400">{subject.units} Units</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div className="mt-3">
          <h3 className="text-base font-bold text-white leading-snug">
            {subject.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Section: {subject.section} • {subject.semester} {subject.academicYear}
          </p>
          <p className="text-xs text-slate-400">
            Instructor: <span className="text-slate-300 font-medium">{subject.instructor}</span>
          </p>
        </div>

        {/* Final Score Banner */}
        <div className={`mt-4 p-4 rounded-2xl border flex items-center justify-between ${
          isPassed
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Final Semestral Grade
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-extrabold font-mono text-white">
                {record.average.toFixed(2)}
              </span>
              <span className="text-sm font-semibold">
                (Equiv: {record.equivalent.toFixed(2)})
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
              isPassed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {record.remarks}
            </span>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Grading Components Breakdown
          </h4>
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80">
            {/* Prelim */}
            <div className="p-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-200">Preliminary Exam</span>
                <span className="text-[10px] text-slate-500 ml-1.5">(30% Weight)</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-white font-bold">{record.prelimScore}</span>
                <span className="text-slate-400 text-[11px] ml-1.5">
                  &rarr; <span className="text-indigo-400 font-semibold">{record.prelimWeighted.toFixed(1)}%</span>
                </span>
              </div>
            </div>

            {/* Midterm */}
            <div className="p-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-200">Midterm Exam</span>
                <span className="text-[10px] text-slate-500 ml-1.5">(30% Weight)</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-white font-bold">{record.midtermScore}</span>
                <span className="text-slate-400 text-[11px] ml-1.5">
                  &rarr; <span className="text-indigo-400 font-semibold">{record.midtermWeighted.toFixed(1)}%</span>
                </span>
              </div>
            </div>

            {/* Finals */}
            <div className="p-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-200">Finals Exam</span>
                <span className="text-[10px] text-slate-500 ml-1.5">(40% Weight)</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-white font-bold">{record.finalsScore}</span>
                <span className="text-slate-400 text-[11px] ml-1.5">
                  &rarr; <span className="text-indigo-400 font-semibold">{record.finalsWeighted.toFixed(1)}%</span>
                </span>
              </div>
            </div>

            {/* Total Sum */}
            <div className="p-3 bg-slate-900/60 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">Computed Final Average</span>
              <span className="text-white font-mono font-bold text-sm">
                {record.prelimWeighted.toFixed(1)} + {record.midtermWeighted.toFixed(1)} + {record.finalsWeighted.toFixed(1)} = {record.average.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Grading Scale Guide */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>Bestlink College Grading System</span>
          </div>
          <p className="leading-relaxed">
            Formula: Prelim (30%) + Midterm (30%) + Finals (40%) = 100%. Passing threshold is 75.00 (Equivalent 3.00 or better). Failing grade is 5.00.
          </p>
        </div>

        {/* Close Button */}
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
