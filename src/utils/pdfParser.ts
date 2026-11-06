import * as pdfjsLib from 'pdfjs-dist';
import { refineExtractedText } from './gemini';
import { ExtractedPdfSummary, StudentGradeRecord } from '../types';

// Polyfill for Uint8Array.prototype.toHex in case older browser runtimes lack it
if (typeof Uint8Array !== 'undefined' && !(Uint8Array.prototype as any).toHex) {
  (Uint8Array.prototype as any).toHex = function () {
    return Array.from(this)
      .map((b: any) => b.toString(16).padStart(2, '0'))
      .join('');
  };
}

if (typeof Math !== 'undefined' && !(Math as any).sumPrecise) {
  (Math as any).sumPrecise = function (numbers: Iterable<number>) {
    let sum = 0;
    for (const n of numbers) {
      sum += n;
    }
    return sum;
  };
}

// Set up worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (e) {
  console.warn('Local PDF worker setup fallback:', e);
}

/**
 * Normalizes custom font Private Use Area (PUA) codes
 * commonly produced by the Bestlink College Student Management System (SMS).
 */
export function normalizePuaText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\ue002/g, 'G')
    .replace(/\ue02c/g, 'a')
    .replace(/\ue050/g, 'l')
    .replace(/\ue05f/g, 'r')
    .replace(/\ue06c/g, '1')
    .replace(/\ue06d/g, '3')
    .replace(/\ue06e/g, '4')
    .replace(/\ue06f/g, '6')
    .replace(/\ue070/g, '9');
}

/**
 * Reconstructs a line of text from positioned PDF.js items.
 * Prevents inserting spaces between contiguous font fragments of numbers and words.
 */
function reconstructLineFromItems(items: { str: string; x: number; width?: number }[]): string {
  items.sort((a, b) => a.x - b.x);
  let line = '';
  let prevEnd = -1;

  for (const item of items) {
    if (!item.str) continue;

    if (item.str === ' ') {
      if (!line.endsWith(' ')) line += ' ';
      prevEnd = item.x + (item.width || 0);
      continue;
    }

    const gap = prevEnd >= 0 ? item.x - prevEnd : 0;
    // Word spacing gap in standard tabular font is > 2.5px
    if (gap > 2.5 && !line.endsWith(' ')) {
      line += ' ';
    }

    line += item.str;
    prevEnd = item.x + (item.width || 0);
  }

  return line.trim();
}

const KNOWN_SUBJECTS: Record<string, string> = {
  IPT101: 'Integrative Programming And Technologies 1',
  ITE1: 'IT ELECTIVE 1 (Web Fundamental)',
  ITE4: 'IT ELECTIVE 4',
  MS102: 'Quantitative Methods with Modelling Simulation',
  CS201: 'Data Structures and Algorithms',
  IT101: 'Introduction to Information Technology',
  IPT102: 'Integrative Programming And Technologies 2'
};

export function parseGradeTableText(rawFullText: string): ExtractedPdfSummary {
  const fullText = normalizePuaText(rawFullText);
  const lines = fullText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  let subjectCode = '';
  let subjectTitle = '';
  let section = 'BSIT 21001';
  let units = 3;
  let semester = '1st Semester';
  let academicYear = '2026-2027';
  let instructor = 'Romel Bernabe Cabiling';
  let programHead = 'Rommel Jaraba Constantino DIT';

  // 1. Extract metadata from lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Subject Code: e.g. "Subject Code MS102" or "Subject Code IPT101"
    const codeMatch = line.match(/Subject\s*Code[:\t\s]*([A-Z0-9]+)/i);
    if (codeMatch && !subjectCode) {
      subjectCode = codeMatch[1].trim();
    }

    // Subject Description
    const descMatch = line.match(/Subject\s*Description[:\t\s]*([^,\n]+)/i);
    if (descMatch && descMatch[1].trim() !== 'N/A' && descMatch[1].trim().length > 3) {
      subjectTitle = descMatch[1].trim();
    }

    // Units
    const unitsMatch = line.match(/Units[:\t\s]*(\d+)/i);
    if (unitsMatch) {
      units = parseInt(unitsMatch[1], 10);
    }

    // Semester
    const semMatch = line.match(/(1st|2nd|Summer)\s*Semester/i);
    if (semMatch) {
      semester = semMatch[0];
    }

    // Academic Year
    const ayMatch = line.match(/Academic\s*Year[:\t\s]*(\d{4}-\d{4})/i) || line.match(/(\d{4}-\d{4})/);
    if (ayMatch) {
      academicYear = ayMatch[1];
    }

    // Section (e.g., BSIT 21001, B S I T 2 1 0 0 1)
    const secMatch = line.match(/B\s*S\s*I\s*T\s*([0-9\s]{5,10})|BSIT\s*\d{5}/i);
    if (secMatch) {
      const cleanSec = secMatch[0].replace(/\s+/g, '');
      const secFormatted = cleanSec.match(/([A-Z]+)(\d+)/);
      section = secFormatted ? `${secFormatted[1]} ${secFormatted[2]}` : cleanSec;
    }

    // Instructor / Prepared By
    const prepMatch = line.match(/Prepared\s*By[:\t\s]*([A-Za-z\s.]+?)(?=Instructor|Submitted|$)/i);
    if (prepMatch && prepMatch[1].trim().length > 3) {
      instructor = prepMatch[1].trim();
    } else if (/Prepared\s*By/i.test(line) && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (!/Instructor|Submitted/i.test(nextLine) && nextLine.length > 3) {
        instructor = nextLine;
      }
    }

    // Program Head
    const progMatch = line.match(/Submitted\s*To[:\t\s]*([A-Za-z\s.]+?)(?=Program\s*Head|DIT|$)/i);
    if (progMatch && progMatch[1].trim().length > 3) {
      programHead = progMatch[1].trim();
    }
  }

  // 2. Resolve Subject Title
  if (subjectCode && KNOWN_SUBJECTS[subjectCode]) {
    subjectTitle = KNOWN_SUBJECTS[subjectCode];
  } else if (!subjectTitle) {
    // Look above the "No." header row on page 1
    for (let i = 0; i < lines.length; i++) {
      if (/^No\b/i.test(lines[i]) || /Student\s*ID/i.test(lines[i])) {
        if (i > 0) {
          let prev = lines[i - 1].replace(/\s+/g, ' ').trim();
          if (/([A-Za-z]\s+){3,}/.test(prev)) {
            prev = prev.replace(/\s+/g, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
          }
          subjectTitle = prev;
        }
        break;
      }
    }
  }

  if (!subjectTitle) {
    subjectTitle = subjectCode || 'Semestral Subject';
  }

  // 3. Parse Student Rows
  const records: StudentGradeRecord[] = [];
  let recordCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect student ID (typically 9 digits, e.g. 250102531, 230116406)
    const studentIdMatch = line.match(/\b(2\d{8})\b/) || line.match(/\b(\d{9})\b/);
    if (!studentIdMatch) continue;

    const studentId = studentIdMatch[1];
    const sexMatch = line.match(/\b(Male|Female)\b/i);
    const sex = sexMatch ? (sexMatch[1].charAt(0).toUpperCase() + sexMatch[1].slice(1).toLowerCase()) : 'Male';

    // Extract name: text between student ID and sex
    let name = 'Unknown Student';
    if (sexMatch && sexMatch.index !== undefined && studentIdMatch.index !== undefined) {
      const start = studentIdMatch.index + studentId.length;
      const end = sexMatch.index;
      name = line
        .substring(start, end)
        .trim()
        .replace(/^[^a-zA-Z]+/, '')
        .replace(/[^a-zA-Z\s,.-]+$/, '')
        .trim();
    }

    // Extract numbers after sex
    const afterSex = sexMatch && sexMatch.index !== undefined
      ? line.substring(sexMatch.index + sexMatch[0].length)
      : line;

    const numbers = afterSex.match(/-?\d+(?:\.\d+)?/g) || [];

    let prelimScore = 0;
    let prelimWeighted = 0;
    let midtermScore = 0;
    let midtermWeighted = 0;
    let finalsScore = 0;
    let finalsWeighted = 0;
    let average = 0;
    let equivalent = 5.0;
    let remarks: 'Passed' | 'Failed' | string = 'Passed';

    if (numbers.length >= 8) {
      prelimScore = parseFloat(numbers[0] || '0');
      prelimWeighted = parseFloat(numbers[1] || '0');
      midtermScore = parseFloat(numbers[2] || '0');
      midtermWeighted = parseFloat(numbers[3] || '0');
      finalsScore = parseFloat(numbers[4] || '0');
      finalsWeighted = parseFloat(numbers[5] || '0');
      average = parseFloat(numbers[6] || '0');
      equivalent = parseFloat(numbers[7] || '0');
    } else if (numbers.length >= 4) {
      prelimScore = parseFloat(numbers[0] || '0');
      midtermScore = parseFloat(numbers[1] || '0');
      finalsScore = parseFloat(numbers[2] || '0');
      average = parseFloat(numbers[3] || '0');
      prelimWeighted = Number((prelimScore * 0.3).toFixed(1));
      midtermWeighted = Number((midtermScore * 0.3).toFixed(1));
      finalsWeighted = Number((finalsScore * 0.4).toFixed(1));
      equivalent = average >= 75 ? Number(((100 - average) / 10 + 1).toFixed(2)) : 5.0;
    } else if (numbers.length >= 1) {
      average = parseFloat(numbers[numbers.length - 1] || '0');
      equivalent = average >= 75 ? 2.0 : 5.0;
    }

    // Remarks
    if (/Failed/i.test(line) || equivalent >= 4.0 || average < 75) {
      remarks = 'Failed';
    } else {
      remarks = 'Passed';
    }

    const firstNum = line.match(/^\s*(\d+)\b/);
    const rowNo = firstNum ? parseInt(firstNum[1], 10) : recordCounter;

    records.push({
      no: rowNo,
      studentId,
      name,
      sex,
      prelimScore,
      prelimWeighted,
      midtermScore,
      midtermWeighted,
      finalsScore,
      finalsWeighted,
      average,
      equivalent,
      remarks
    });

    recordCounter++;
  }

  return {
    subjectTitle,
    subjectCode: subjectCode || 'SUBJ101',
    section,
    units,
    semester,
    academicYear,
    instructor,
    programHead,
    records,
    rawTextSample: lines.slice(0, 30).join('\n')
  };
}

export async function extractTextFromPdf(file: File): Promise<ExtractedPdfSummary> {
  const arrayBuffer = await file.arrayBuffer();

  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true
  });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let fullExtractedText = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    interface TextItem {
      str: string;
      x: number;
      y: number;
      width?: number;
    }

    const items: TextItem[] = (textContent.items as any[])
      .map(item => ({
        str: normalizePuaText(item.str || ''),
        x: item.transform ? item.transform[4] : 0,
        y: item.transform ? item.transform[5] : 0,
        width: item.width || 0
      }))
      .filter(item => item.str.length > 0);

    // Group items into lines within 4.5px vertical delta
    const lineBuckets: { y: number; items: TextItem[] }[] = [];
    for (const item of items) {
      let bucket = lineBuckets.find(b => Math.abs(b.y - item.y) < 4.5);
      if (!bucket) {
        bucket = { y: item.y, items: [] };
        lineBuckets.push(bucket);
      }
      bucket.items.push(item);
    }

    // Sort lines top-to-bottom
    lineBuckets.sort((a, b) => b.y - a.y);

    for (const bucket of lineBuckets) {
      const lineText = reconstructLineFromItems(bucket.items);
      if (lineText) {
        fullExtractedText += lineText + '\n';
      }
    }
  }

  const refinedText = await refineExtractedText(fullExtractedText);
  return parseGradeTableText(refinedText);
}
