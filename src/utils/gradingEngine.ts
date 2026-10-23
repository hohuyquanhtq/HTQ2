import { Exam, StudentAnswers, ExamResult, CognitiveLevel } from '../types';

/**
 * Normalizes True/False values:
 * 'Đ', 'đ', 'D', 'd', 'True', 'T' -> 'D'
 * 'S', 's', 'Sai', 'False', 'F' -> 'S'
 */
export function normalizeTF(val?: string | null): 'D' | 'S' | null {
  if (!val) return null;
  const clean = val.toString().toUpperCase().trim();
  if (clean.includes('Đ') || clean === 'D' || clean === 'T' || clean.includes('TRUE') || clean.includes('ĐÚNG')) {
    return 'D';
  }
  if (clean.includes('S') || clean === 'F' || clean.includes('FALSE') || clean.includes('SAI')) {
    return 'S';
  }
  return null;
}

/**
 * Normalizes a short answer string:
 * - Trims whitespace
 * - Converts lowercase
 * - Normalizes comma decimal to dot (e.g. 2,5 -> 2.5)
 */
export function normalizeShortAnswer(val: string): string {
  if (!val) return '';
  let str = val.trim().toLowerCase();
  str = str.replace(',', '.');
  // Remove common unit annotations like " (gam)", " (mol)", " (lít)", " m", " gam"
  str = str.replace(/\s*\([a-zA-ZÀ-ỹ\s\/%^0-9-]+\)$/, '');
  str = str.replace(/\s+(gam|g|mol|l|ml|lít|m|cm|kg|atm|bar|j|kj|kwh)$/, '');
  
  // If numeric, parse and reformat to remove trailing .0 or leading zeros
  const num = parseFloat(str);
  if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(str)) {
    return num.toString();
  }
  return str.trim();
}

/**
 * Compares student's short answer against standard answer:
 * Handles multiple accepted alternatives separated by ;, /, |, or 'hoặc'.
 * Handles decimal comma vs dot (2,5 == 2.5).
 * Handles scientific tolerance for floating numbers.
 */
export function isShortAnswerCorrect(studentInput: string, standardAnswer: string): boolean {
  if (!studentInput || !standardAnswer) return false;
  
  const normStudent = normalizeShortAnswer(studentInput);
  if (!normStudent) return false;

  // Split standard answer into acceptable candidates
  const candidates = standardAnswer
    .split(/;|\/|\||\n|\s+hoặc\s+/i)
    .map((c) => normalizeShortAnswer(c))
    .filter((c) => c.length > 0);

  // If no candidates found, fallback to single normalized
  if (candidates.length === 0) {
    candidates.push(normalizeShortAnswer(standardAnswer));
  }

  const studentNum = parseFloat(normStudent);
  const isStudentNum = !isNaN(studentNum) && /^-?\d+(\.\d+)?$/.test(normStudent);

  for (const candidate of candidates) {
    if (normStudent === candidate) return true;
    
    // Check numeric equivalence
    if (isStudentNum) {
      const candNum = parseFloat(candidate);
      if (!isNaN(candNum) && Math.abs(studentNum - candNum) < 1e-4) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Grades a full student submission against an exam according to GDPT 2018 regulations.
 */
export function gradeExam(
  exam: Exam,
  studentName: string,
  studentClass: string,
  answers: StudentAnswers,
  timeSpentSeconds: number,
  startedAt: string
): ExamResult {
  const p1Questions = exam.questions.filter((q) => q.part === 'PART_I');
  const p2Questions = exam.questions.filter((q) => q.part === 'PART_II');
  const p3Questions = exam.questions.filter((q) => q.part === 'PART_III');

  // Part I Points
  const p1WeightPerQ = p1Questions.length > 0 ? exam.partPoints.PART_I / p1Questions.length : 0;
  let part1Score = 0;
  let p1Correct = 0;

  p1Questions.forEach((q) => {
    const studentAns = answers[q.id]?.selectedOption;
    if (studentAns && q.correctOption && studentAns.toUpperCase().trim() === q.correctOption.toUpperCase().trim()) {
      part1Score += p1WeightPerQ;
      p1Correct++;
    }
  });

  // Part II Points (Lũy tiến Bộ GD&ĐT 2018)
  // Quy tắc chuẩn 1 câu:
  // 1 ý đúng: 10% điểm câu (0.1 pt / 1.0)
  // 2 ý đúng: 25% điểm câu (0.25 pt / 1.0)
  // 3 ý đúng: 50% điểm câu (0.50 pt / 1.0)
  // 4 ý đúng: 100% điểm câu (1.00 pt / 1.0)
  const p2WeightPerQ = p2Questions.length > 0 ? exam.partPoints.PART_II / p2Questions.length : 0;
  let part2Score = 0;
  let p2FullCorrect = 0;
  let p2PartialCorrect = 0;

  p2Questions.forEach((q) => {
    if (!q.items || q.items.length === 0) return;
    const studentSubAnswers = answers[q.id]?.subItems || {};

    let correctSubItems = 0;
    q.items.forEach((item) => {
      const studentVal = normalizeTF(studentSubAnswers[item.label]);
      const standardVal = normalizeTF(item.correctAnswer);
      if (studentVal && standardVal && studentVal === standardVal) {
        correctSubItems++;
      }
    });

    let factor = 0;
    if (correctSubItems === 1) factor = 0.10;
    else if (correctSubItems === 2) factor = 0.25;
    else if (correctSubItems === 3) factor = 0.50;
    else if (correctSubItems === 4) factor = 1.00;

    const questionScore = p2WeightPerQ * factor;
    part2Score += questionScore;

    if (correctSubItems === 4) {
      p2FullCorrect++;
    } else if (correctSubItems > 0) {
      p2PartialCorrect++;
    }
  });

  // Part III Points (Trả lời ngắn)
  const p3WeightPerQ = p3Questions.length > 0 ? exam.partPoints.PART_III / p3Questions.length : 0;
  let part3Score = 0;
  let p3Correct = 0;

  p3Questions.forEach((q) => {
    const studentText = answers[q.id]?.shortAnswerText || '';
    if (q.shortAnswer && studentText) {
      if (isShortAnswerCorrect(studentText, q.shortAnswer)) {
        part3Score += p3WeightPerQ;
        p3Correct++;
      }
    }
  });

  // Calculate totals and round to 2 decimals
  part1Score = Math.round(part1Score * 100) / 100;
  part2Score = Math.round(part2Score * 100) / 100;
  part3Score = Math.round(part3Score * 100) / 100;

  let totalScore = Math.round((part1Score + part2Score + part3Score) * 100) / 100;
  totalScore = Math.min(10.0, Math.max(0, totalScore));

  const totalQuestions = exam.questions.length;
  const correctCount = p1Correct + p2FullCorrect + p3Correct;
  const partialCount = p2PartialCorrect;

  // Unanswered count
  let unansweredCount = 0;
  exam.questions.forEach((q) => {
    const ans = answers[q.id];
    if (!ans) {
      unansweredCount++;
      return;
    }
    if (q.part === 'PART_I' && !ans.selectedOption) unansweredCount++;
    else if (q.part === 'PART_II' && (!ans.subItems || Object.keys(ans.subItems).length === 0)) unansweredCount++;
    else if (q.part === 'PART_III' && (!ans.shortAnswerText || ans.shortAnswerText.trim() === '')) unansweredCount++;
  });

  const incorrectCount = totalQuestions - correctCount - partialCount - unansweredCount;

  // By Cognitive Level Breakdown
  const levels: CognitiveLevel[] = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'];
  const byLevel: ExamResult['byLevel'] = {
    NHAN_BIET: { total: 0, correct: 0, score: 0, maxScore: 0 },
    THONG_HIEU: { total: 0, correct: 0, score: 0, maxScore: 0 },
    VAN_DUNG: { total: 0, correct: 0, score: 0, maxScore: 0 },
    VAN_DUNG_CAO: { total: 0, correct: 0, score: 0, maxScore: 0 }
  };

  exam.questions.forEach((q) => {
    const lvl = q.level || 'THONG_HIEU';
    byLevel[lvl].total++;

    let weight = 0;
    let earned = 0;
    let isFull = false;

    if (q.part === 'PART_I') {
      weight = p1WeightPerQ;
      if (answers[q.id]?.selectedOption?.toUpperCase() === q.correctOption?.toUpperCase()) {
        earned = weight;
        isFull = true;
      }
    } else if (q.part === 'PART_II') {
      weight = p2WeightPerQ;
      const sub = answers[q.id]?.subItems || {};
      let c = 0;
      q.items?.forEach((it) => {
        const sVal = normalizeTF(sub[it.label]);
        const aVal = normalizeTF(it.correctAnswer);
        if (sVal && aVal && sVal === aVal) c++;
      });
      let factor = 0;
      if (c === 1) factor = 0.1;
      else if (c === 2) factor = 0.25;
      else if (c === 3) factor = 0.5;
      else if (c === 4) factor = 1.0;
      earned = weight * factor;
      if (c === 4) isFull = true;
    } else {
      weight = p3WeightPerQ;
      if (isShortAnswerCorrect(answers[q.id]?.shortAnswerText || '', q.shortAnswer || '')) {
        earned = weight;
        isFull = true;
      }
    }

    byLevel[lvl].maxScore = Math.round((byLevel[lvl].maxScore + weight) * 100) / 100;
    byLevel[lvl].score = Math.round((byLevel[lvl].score + earned) * 100) / 100;
    if (isFull) byLevel[lvl].correct++;
  });

  const unlockedExplanation = totalScore >= (exam.minScoreForExplanation ?? 0);

  return {
    id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    examId: exam.id,
    examTitle: exam.title,
    studentName: studentName || 'Học sinh',
    studentClass: studentClass || '11A',
    startedAt,
    submittedAt: new Date().toISOString(),
    timeSpentSeconds,
    answers,
    part1Score,
    part2Score,
    part3Score,
    totalScore,
    maxScore: 10.0,
    correctCount,
    partialCount,
    incorrectCount,
    unansweredCount,
    unlockedExplanation,
    byLevel
  };
}
