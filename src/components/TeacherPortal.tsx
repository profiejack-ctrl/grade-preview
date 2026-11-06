import React, { useState } from 'react';
import { useGrades } from '../context/GradesContext';
import { Subject, StudentGradeRecord, ExtractedPdfSummary } from '../types';
import { extractTextFromPdf, parseGradeTableText } from '../utils/pdfParser';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Users,
  Award,
  BookOpen,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';

export const TeacherPortal: React.FC = () => {
  const { subjects, addSubject, deleteSubject, resetToDefault, dbEngine } = useGrades();
  const [activeSubjectId, setActiveSubjectId] = useState<string>(subjects[0]?.id || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ExtractedPdfSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRemarks, setFilterRemarks] = useState<'all' | 'Passed' | 'Failed'>('all');
  const [showTextPaste, setShowTextPaste] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const activeSubject = subjects.find(s => s.id === activeSubjectId) || subjects[0];

  const processFile = async (file: File) => {
    setIsUploading(true);
    setExtractError(null);
    setPreviewData(null);

    try {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Please select a valid .pdf file.');
      }

      const extracted = await extractTextFromPdf(file);
      if (extracted.records.length === 0) {
        throw new Error(
          'No student grade records could be detected in this PDF. Please ensure it follows standard Semestral Grade table format.'
        );
      }

      setPreviewData(extracted);
    } catch (err: any) {
      console.error('PDF extraction failed:', err);
      setExtractError(err.message || 'Failed to extract text from PDF.');
    } finally {
      setIsUploading(false);
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Text paste parser
  const handleParseText = () => {
    if (!pastedText.trim()) return;
    try {
      setExtractError(null);
      const extracted = parseGradeTableText(pastedText);
      if (extracted.records.length === 0) {
        throw new Error('No student ID rows found in the pasted text.');
      }
      setPreviewData(extracted);
    } catch (err: any) {
      setExtractError(err.message || 'Failed parsing text.');
    }
  };

  // Commit extracted preview into active subjects
  const handleCommitPreview = () => {
    if (!previewData) return;

    const newId = addSubject({
      code: previewData.subjectCode,
      title: previewData.subjectTitle,
      section: previewData.section,
      units: previewData.units,
      semester: previewData.semester,
      academicYear: previewData.academicYear,
      instructor: previewData.instructor,
      programHead: previewData.programHead,
      institution: 'Bestlink College of the Philippines',
      college: 'College Computer Studies',
      gradingSystem: 'Professional Subjects (*Laboratory)',
      records: previewData.records
    });

    setActiveSubjectId(newId);
    setPreviewData(null);
    setPastedText('');
    setShowTextPaste(false);
  };

  // Quick preset template loader for demo
  const handleLoadSampleSubject = (type: 'IPT' | 'ITE' | 'DSA') => {
    if (type === 'DSA') {
      const sampleRecords: StudentGradeRecord[] = [
        { no: 1, studentId: '250102531', name: 'Abayon, Shawn Daniel', sex: 'Male', prelimScore: 90, prelimWeighted: 27.0, midtermScore: 88, midtermWeighted: 26.4, finalsScore: 85, finalsWeighted: 34.0, average: 87.40, equivalent: 2.00, remarks: 'Passed' },
        { no: 2, studentId: '250103286', name: 'Romanca, Jake Kent', sex: 'Male', prelimScore: 98, prelimWeighted: 29.4, midtermScore: 96, midtermWeighted: 28.8, finalsScore: 95, finalsWeighted: 38.0, average: 96.20, equivalent: 1.25, remarks: 'Passed' },
        { no: 3, studentId: '230103059', name: 'Algodon, Mark Ryan', sex: 'Male', prelimScore: 78, prelimWeighted: 23.4, midtermScore: 80, midtermWeighted: 24.0, finalsScore: 76, finalsWeighted: 30.4, average: 77.80, equivalent: 2.75, remarks: 'Passed' },
        { no: 4, studentId: '250100664', name: 'Belmi, Xena Lewis', sex: 'Female', prelimScore: 94, prelimWeighted: 28.2, midtermScore: 92, midtermWeighted: 27.6, finalsScore: 91, finalsWeighted: 36.4, average: 92.20, equivalent: 1.50, remarks: 'Passed' }
      ];

      addSubject({
        code: 'CS201',
        title: 'Data Structures and Algorithms',
        section: 'BSIT 21001',
        units: 3,
        semester: '1st Semester',
        academicYear: '2026-2027',
        instructor: 'Romel Bernabe Cabiling',
        programHead: 'Rommel Jaraba Constantino DIT',
        records: sampleRecords
      });
    }
  };

  // Statistics for active subject
  const records = activeSubject?.records || [];
  const totalStudents = records.length;
  const passedStudents = records.filter(r => r.remarks === 'Passed').length;
  const failedStudents = totalStudents - passedStudents;
  const passingRate = totalStudents > 0 ? ((passedStudents / totalStudents) * 100).toFixed(1) : '0';
  const classAvg = totalStudents > 0
    ? (records.reduce((acc, r) => acc + r.average, 0) / totalStudents).toFixed(2)
    : '0';

  const filteredRecords = records.filter(rec => {
    const matchesSearch =
      rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.studentId.includes(searchQuery);
    const matchesRemarks = filterRemarks === 'all' || rec.remarks === filterRemarks;
    return matchesSearch && matchesRemarks;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
      {/* Teacher Profile / Dashboard Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl shadow-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
              Faculty / Admin Portal
            </span>
            <span className="text-xs text-slate-400">Computer Studies Dept</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Prof. Romel Bernabe Cabiling
          </h2>
          <p className="text-xs text-slate-400">
            Instructor • Bestlink College of the Philippines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{dbEngine === 'neon-postgres' ? 'Neon Database' : 'SQLite Database'}</span>
          </div>

          <button
            onClick={resetToDefault}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* PDF Upload Section (Teacher Request Highlight) */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Upload Semestral Grades PDF
              </h3>
              <p className="text-xs text-slate-400">
                Supports multi-grade & multi-subject PDF summaries (Bestlink College format)
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowTextPaste(p => !p)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
          >
            {showTextPaste ? 'Hide Paste Box' : 'Paste Raw Text / OCR'}
          </button>
        </div>

        {/* Drag & Drop File Zone */}
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
            isDragging
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : 'border-slate-700 hover:border-amber-500/60 bg-slate-950/40 hover:bg-slate-950/80'
          } group`}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 flex items-center justify-center mb-3 transition">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-200">
            {isUploading ? 'Extracting PDF Data...' : 'Drop Semestral Grade PDF here or Click to Browse'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
            Automatically extracts Subject Code, Description, Section, Student IDs, Names, Prelim, Midterm, Finals, Average & Equivalent.
          </p>
        </label>

        {/* Text Paste Fallback Section */}
        {showTextPaste && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Paste OCR Text or Table Lines
              </label>
              <button
                onClick={() =>
                  setPastedText(
                    `Subject Code: CS201\nSubject Description: Data Structures\nUnits: 3\n1 250102531 Abayon, Shawn Daniel Male 90 27.0 88 26.4 85 34.0 87.40 2.00 Passed\n2 250103247 Ajoc, Mark Gabriel Male 92 27.6 92 27.6 90 36.0 91.20 1.75 Passed`
                  )
                }
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Insert Sample Text
              </button>
            </div>
            <textarea
              rows={4}
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder="Paste table lines here (e.g. 1 250102531 Abayon, Shawn Daniel Male 87 26.1 ...)"
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200"
            />
            <button
              onClick={handleParseText}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
            >
              Parse Text
            </button>
          </div>
        )}

        {/* Sample Subj Injector Buttons */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold">Test with Subject:</span>
          <button
            onClick={() => handleLoadSampleSubject('DSA')}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition"
          >
            + Add 3rd Subject: Data Structures (CS201)
          </button>
        </div>

        {/* Extraction Error */}
        {extractError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{extractError}</span>
          </div>
        )}

        {/* Extracted Preview Confirmation Card */}
        {previewData && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-200 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  Extracted PDF Ready for Publish
                </span>
                <h4 className="text-base font-bold text-white mt-1">
                  {previewData.subjectCode} - {previewData.subjectTitle}
                </h4>
                <p className="text-xs text-slate-300">
                  Section: {previewData.section} • {previewData.semester} • {previewData.units} Units • Instructor: {previewData.instructor}
                </p>
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                  &check; {previewData.records.length} Student Records Extracted
                </p>
              </div>

              <button
                onClick={handleCommitPreview}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Publish</span>
              </button>
            </div>

            {/* Quick table sample */}
            <div className="max-h-40 overflow-y-auto border border-amber-500/20 rounded-xl bg-slate-950/60 p-2">
              <table className="w-full text-[11px] text-left">
                <thead className="text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-1 px-2">ID</th>
                    <th className="py-1 px-2">Name</th>
                    <th className="py-1 px-2">Prelim</th>
                    <th className="py-1 px-2">Midterm</th>
                    <th className="py-1 px-2">Finals</th>
                    <th className="py-1 px-2">Average</th>
                    <th className="py-1 px-2">Equivalent</th>
                    <th className="py-1 px-2">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {previewData.records.slice(0, 5).map(r => (
                    <tr key={r.studentId}>
                      <td className="py-1 px-2 text-indigo-400">{r.studentId}</td>
                      <td className="py-1 px-2 font-sans font-medium text-slate-200">{r.name}</td>
                      <td className="py-1 px-2">{r.prelimScore}</td>
                      <td className="py-1 px-2">{r.midtermScore}</td>
                      <td className="py-1 px-2">{r.finalsScore}</td>
                      <td className="py-1 px-2 font-bold text-white">{r.average.toFixed(2)}</td>
                      <td className="py-1 px-2">{r.equivalent.toFixed(2)}</td>
                      <td className="py-1 px-2">
                        <span className={r.remarks === 'Passed' ? 'text-emerald-400' : 'text-rose-400'}>
                          {r.remarks}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Subject Selector Tabs */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Uploaded Subjects ({subjects.length})</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {subjects.map(s => {
            const isActive = s.id === (activeSubject?.id || '');
            return (
              <button
                key={s.id}
                onClick={() => setActiveSubjectId(s.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{s.code}</span>
                <span className="text-[10px] opacity-75">({s.records.length} students)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Subject Roster Card */}
      {activeSubject && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl shadow-black/20 space-y-4">
          {/* Active Subject Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold text-xs">
                  {activeSubject.code}
                </span>
                <span className="text-xs text-slate-400">
                  {activeSubject.section} • {activeSubject.units} Units
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                {activeSubject.title}
              </h3>
              <p className="text-xs text-slate-400">
                Instructor: {activeSubject.instructor} • {activeSubject.semester} {activeSubject.academicYear}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {subjects.length > 1 && (
                <button
                  onClick={() => deleteSubject(activeSubject.id)}
                  title="Delete this subject"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 text-xs transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Total Students</span>
              <span className="text-xl font-extrabold font-mono text-white">{totalStudents}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Passing Rate</span>
              <span className="text-xl font-extrabold font-mono text-emerald-400">{passingRate}%</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Class Average</span>
              <span className="text-xl font-extrabold font-mono text-indigo-400">{classAvg}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Failed</span>
              <span className="text-xl font-extrabold font-mono text-rose-400">{failedStudents}</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search student ID or name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => setFilterRemarks('all')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterRemarks === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({records.length})
              </button>
              <button
                onClick={() => setFilterRemarks('Passed')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterRemarks === 'Passed'
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                Passed ({passedStudents})
              </button>
              <button
                onClick={() => setFilterRemarks('Failed')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterRemarks === 'Failed'
                    ? 'bg-rose-600/30 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                Failed ({failedStudents})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Student ID</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-2 text-center">Prelim (30%)</th>
                    <th className="py-2.5 px-2 text-center">Midterm (30%)</th>
                    <th className="py-2.5 px-2 text-center">Finals (40%)</th>
                    <th className="py-2.5 px-2 text-center">Average</th>
                    <th className="py-2.5 px-2 text-center">Equiv</th>
                    <th className="py-2.5 px-3 text-center">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredRecords.map(r => {
                    const isPassed = r.remarks === 'Passed';
                    return (
                      <tr key={r.studentId} className="hover:bg-slate-900/60 transition">
                        <td className="py-2.5 px-3 text-slate-500">{r.no}</td>
                        <td className="py-2.5 px-3 font-bold text-indigo-400">{r.studentId}</td>
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                          {r.name}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-300">
                          {r.prelimScore} <span className="text-[10px] text-slate-500">({r.prelimWeighted})</span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-300">
                          {r.midtermScore} <span className="text-[10px] text-slate-500">({r.midtermWeighted})</span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-300">
                          {r.finalsScore} <span className="text-[10px] text-slate-500">({r.finalsWeighted})</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-white">
                          {r.average.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-300">
                          {r.equivalent.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isPassed
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {r.remarks}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredRecords.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                No students match your search criteria.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
