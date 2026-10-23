import { Exam, StudentAnswers, ExamResult, CognitiveLevel } from '../types';

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
  // If numeric, parse and reformat to remove trailing .0 or leading zeros
  const num = parseFloat(str);
  if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(str)) {
    return num.toString();
  }
  return str;
}

/**
 * Grades a full student submission against an exam.
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
    if (studentAns && q.correctOption && studentAns.toUpperCase() === q.correctOption.toUpperCase()) {
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
      const studentVal = studentSubAnswers[item.label];
      if (studentVal && item.correctAnswer && studentVal === item.correctAnswer) {
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

  // Part III Points
  const p3WeightPerQ = p3Questions.length > 0 ? exam.partPoints.PART_III / p3Questions.length : 0;
  let part3Score = 0;
  let p3Correct = 0;

  p3Questions.forEach((q) => {
    const studentText = answers[q.id]?.shortAnswerText || '';
    if (q.shortAnswer && studentText) {
      const normStudent = normalizeShortAnswer(studentText);
      const normCorrect = normalizeShortAnswer(q.shortAnswer);

      if (normStudent === normCorrect) {
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
        if (sub[it.label] && sub[it.label] === it.correctAnswer) c++;
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
      if (normalizeShortAnswer(answers[q.id]?.shortAnswerText || '') === normalizeShortAnswer(q.shortAnswer || '')) {
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
