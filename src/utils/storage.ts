import { Question, Exam, ExamResult } from '../types';
import { SAMPLE_CHEMISTRY_QUESTIONS, DEFAULT_SAMPLE_EXAM } from './sampleExamData';

const STORAGE_KEYS = {
  QUESTIONS: 'educhem_questions_v2',
  EXAMS: 'educhem_exams_v2',
  RESULTS: 'educhem_results_v2'
};

export function loadQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (!raw) {
      // First time initialize with sample questions
      saveQuestions(SAMPLE_CHEMISTRY_QUESTIONS);
      return SAMPLE_CHEMISTRY_QUESTIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load questions from localStorage:', err);
    return SAMPLE_CHEMISTRY_QUESTIONS;
  }
}

export function saveQuestions(questions: Question[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  } catch (err) {
    console.error('Failed to save questions to localStorage:', err);
  }
}

export function loadExams(): Exam[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAMS);
    if (!raw) {
      saveExams([DEFAULT_SAMPLE_EXAM]);
      return [DEFAULT_SAMPLE_EXAM];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load exams:', err);
    return [DEFAULT_SAMPLE_EXAM];
  }
}

export function saveExams(exams: Exam[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
  } catch (err) {
    console.error('Failed to save exams:', err);
  }
}

export function loadResults(): ExamResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load results:', err);
    return [];
  }
}

export function saveResult(result: ExamResult): void {
  try {
    const existing = loadResults();
    existing.unshift(result);
    // Keep last 50 submissions
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(existing.slice(0, 50)));
  } catch (err) {
    console.error('Failed to save result:', err);
  }
}

/**
 * Exports full backup as JSON download
 */
export function exportBackupJson(questions: Question[], exams: Exam[]): void {
  const data = {
    appName: 'EduChem Studio',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    questionCount: questions.length,
    examCount: exams.length,
    questions,
    exams
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `EduChem_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Validates and imports JSON backup
 */
export function importBackupJson(
  jsonText: string,
  existingQuestions: Question[],
  mergeMode: 'MERGE' | 'REPLACE'
): { success: boolean; newQuestions: Question[]; importedCount: number; message: string } {
  try {
    const data = JSON.parse(jsonText);
    if (!data.questions || !Array.isArray(data.questions)) {
      return { success: false, newQuestions: existingQuestions, importedCount: 0, message: 'Tệp JSON không hợp lệ: thiếu danh sách questions' };
    }

    const importedQs: Question[] = data.questions.filter((q: any) => q && q.content && q.part);
    if (importedQs.length === 0) {
      return { success: false, newQuestions: existingQuestions, importedCount: 0, message: 'Không tìm thấy câu hỏi hợp lệ trong tệp sao lưu' };
    }

    let finalQuestions: Question[] = [];
    if (mergeMode === 'REPLACE') {
      finalQuestions = importedQs;
    } else {
      // Merge: avoid duplicates by ID or identical content
      const existingIds = new Set(existingQuestions.map((q) => q.id));
      const existingContents = new Set(existingQuestions.map((q) => q.content.slice(0, 60).toLowerCase()));

      const toAdd: Question[] = [];
      importedQs.forEach((q) => {
        const key = q.content.slice(0, 60).toLowerCase();
        if (!existingIds.has(q.id) && !existingContents.has(key)) {
          toAdd.push(q);
        }
      });
      finalQuestions = [...existingQuestions, ...toAdd];
    }

    saveQuestions(finalQuestions);
    return {
      success: true,
      newQuestions: finalQuestions,
      importedCount: importedQs.length,
      message: `Đã nạp thành công ${importedQs.length} câu hỏi (${mergeMode === 'REPLACE' ? 'Ghi đè' : 'Hợp nhất'}).`
    };
  } catch (err: any) {
    return { success: false, newQuestions: existingQuestions, importedCount: 0, message: `Lỗi đọc tệp JSON: ${err.message}` };
  }
}
