import React from 'react';
import { useGrades } from '../context/GradesContext';
import { X, Printer, Download, GraduationCap, CheckCircle } from 'lucide-react';

interface GradeSlipModalProps {
  studentId: string;
  onClose: () => void;
}

export const GradeSlipModal: React.FC<GradeSlipModalProps> = ({ studentId, onClose }) => {
  const { getStudentSubjects } = useGrades();
  const enrolled = getStudentSubjects(studentId);

  if (enrolled.length === 0) return null;

  const firstRec = enrolled[0].record;
  const firstSubj = enrolled[0].subject;

  // Compute GWA
  let totalWeightedScore = 0;
  let totalUnits = 0;
  let passedUnits = 0;

  enrolled.forEach(({ subject, record }) => {
    totalWeightedScore += record.average * subject.units;
    totalUnits += subject.units;
    if (record.remarks === 'Passed') {
      passedUnits += subject.units;
    }
  });

  const gwa = totalUnits > 0 ? (totalWeightedScore / totalUnits).toFixed(2) : '0.00';
  
  // Approximate GWA Equivalent
  let gwaEquiv = '5.00';
  const gwaNum = parseFloat(gwa);
  if (gwaNum >= 97) gwaEquiv = '1.00';
  else if (gwaNum >= 94) gwaEquiv = '1.25';
  else if (gwaNum >= 91) gwaEquiv = '1.50';
  else if (gwaNum >= 88) gwaEquiv = '1.75';
  else if (gwaNum >= 85) gwaEquiv = '2.00';
  else if (gwaNum >= 82) gwaEquiv = '2.25';
  else if (gwaNum >= 79) gwaEquiv = '2.50';
  else if (gwaNum >= 76) gwaEquiv = '2.75';
  else if (gwaNum >= 75) gwaEquiv = '3.00';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Control Bar (Non-printable) */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <span className="text-xs font-semibold flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Official Semestral Grade Slip Preview</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Grade Slip Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5 print:p-0">
          {/* Institution Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900">
            <div className="flex justify-center mb-1">
              <div className="w-12 h-12 rounded-full border-2 border-blue-900 flex items-center justify-center font-bold text-blue-900 text-sm">
                BCP
              </div>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-blue-950 font-serif">
              Bestlink College of the Philippines
            </h2>
            <p className="text-[11px] text-slate-600">
              #1071 Brgy. Kaligayahan, Quirino Highway Novaliches Quezon City
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Contact #: 8442-8601 | 8518-8050
            </p>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mt-2">
              Official Semestral Grade Report
            </h3>
            <p className="text-xs text-indigo-900 font-semibold">
              College of Computer Studies • {firstSubj.semester}, A.Y. {firstSubj.academicYear}
            </p>
          </div>

          {/* Student Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Student Name</span>
              <span className="font-bold text-slate-900 text-sm">{firstRec.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Student ID</span>
              <span className="font-bold font-mono text-slate-900 text-sm">{firstRec.studentId}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Program & Section</span>
              <span className="font-semibold text-slate-800">{firstSubj.section} (BSIT)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Date Issued</span>
              <span className="font-mono text-slate-800">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3">Subject Code</th>
                  <th className="py-2.5 px-3">Descriptive Title</th>
                  <th className="py-2.5 px-2 text-center">Units</th>
                  <th className="py-2.5 px-2 text-center">Prelim</th>
                  <th className="py-2.5 px-2 text-center">Midterm</th>
                  <th className="py-2.5 px-2 text-center">Finals</th>
                  <th className="py-2.5 px-2 text-center">Average</th>
                  <th className="py-2.5 px-2 text-center">Equivalent</th>
                  <th className="py-2.5 px-3 text-center">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {enrolled.map(({ subject, record }) => {
                  const isPassed = record.remarks === 'Passed';
                  return (
                    <tr key={subject.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{subject.code}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{subject.title}</td>
                      <td className="py-2.5 px-2 text-center font-mono">{subject.units}.0</td>
                      <td className="py-2.5 px-2 text-center font-mono">{record.prelimScore}</td>
                      <td className="py-2.5 px-2 text-center font-mono">{record.midtermScore}</td>
                      <td className="py-2.5 px-2 text-center font-mono">{record.finalsScore}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold">{record.average.toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold">{record.equivalent.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            isPassed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {record.remarks}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Box */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-100 rounded-xl border border-slate-200 text-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Units</span>
              <span className="text-base font-bold font-mono text-slate-900">{totalUnits}.0</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">General Weighted Avg (GWA)</span>
              <span className="text-base font-bold font-mono text-indigo-700">{gwa}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Overall Equivalent</span>
              <span className="text-base font-bold font-mono text-slate-900">{gwaEquiv}</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-800">
                {firstSubj.instructor}
              </div>
              <span className="text-[11px] text-slate-500">Subject Instructor</span>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-800">
                {firstSubj.programHead || 'Rommel Jaraba Constantino DIT'}
              </div>
              <span className="text-[11px] text-slate-500">Program Head, Computer Studies</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-2">
            Generated via BCP GradePulse • This digital grade slip is verified for academic viewing purposes.
          </div>
        </div>
      </div>
    </div>
  );
};
