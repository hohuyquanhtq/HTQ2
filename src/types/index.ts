export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';

export type CognitiveLevel = 'NHAN_BIET' | 'THONG_HIEU' | 'VAN_DUNG' | 'VAN_DUNG_CAO';

export type PartType = 'PART_I' | 'PART_II' | 'PART_III';

export interface MultipleChoiceOption {
  label: 'A' | 'B' | 'C' | 'D';
  content: string;
}

export interface TrueFalseItem {
  label: 'a' | 'b' | 'c' | 'd';
  content: string;
  correctAnswer: 'D' | 'S' | null;
  explanation?: string;
}

export interface Question {
  id: string;
  subject: string;
  grade: number;
  chapter: string;
  lesson?: string;
  topic?: string;
  subjectId?: string;
  gradeId?: string;
  chapterId?: string;
  lessonId?: string;
  topicId?: string;
  part: PartType;
  type: QuestionType;
  level: CognitiveLevel;
  customLevelTag?: string; // e.g. "[HIỂU – VẬN DỤNG]" or "[VẬN DỤNG CAO]"
  content: string;
  options?: MultipleChoiceOption[];
  correctOption?: string | null; // 'A' | 'B' | 'C' | 'D'
  items?: TrueFalseItem[]; // 4 items for True/False
  shortAnswer?: string | null; // e.g. "2,5" or "4" or "33"
  explanation?: string;
  images?: string[]; // Embedded base64 images extracted from docx
  sourceDoc?: string;
  isVerified: boolean;
  validationWarnings?: string[];
  rawText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamMatrixConfig {
  title: string;
  subject: string;
  grade: number;
  durationMinutes: number;
  passcode?: string;
  minScoreForExplanation: number;
  part1Count: number;
  part1Points: number; // default 3.0
  part2Count: number;
  part2Points: number; // default 4.0 or 2.0
  part3Count: number;
  part3Points: number; // default 2.0 or 3.0
  levelDistribution: {
    NHAN_BIET: number;
    THONG_HIEU: number;
    VAN_DUNG: number;
    VAN_DUNG_CAO: number;
  };
  selectedChapters: string[];
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  grade: number;
  durationMinutes: number;
  passcode?: string;
  pinCode?: string; // 6-digit access code, e.g. "839201"
  minScoreForExplanation: number;
  partPoints: {
    PART_I: number;
    PART_II: number;
    PART_III: number;
  };
  questions: Question[];
  createdAt: string;
}

export interface StudentAnswers {
  [questionId: string]: {
    selectedOption?: string; // Part I
    subItems?: { [subLabel: string]: 'D' | 'S' }; // Part II: { a: 'D', b: 'S', ... }
    shortAnswerText?: string; // Part III
  };
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  studentName: string;
  studentClass: string;
  startedAt: string;
  submittedAt: string;
  timeSpentSeconds: number;
  answers: StudentAnswers;
  part1Score: number;
  part2Score: number;
  part3Score: number;
  totalScore: number;
  maxScore: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  unansweredCount: number;
  unlockedExplanation: boolean;
  byLevel: {
    [key in CognitiveLevel]: {
      total: number;
      correct: number;
      score: number;
      maxScore: number;
    };
  };
}

export const COGNITIVE_LEVEL_LABELS: Record<CognitiveLevel, string> = {
  NHAN_BIET: 'Nhận biết',
  THONG_HIEU: 'Thông hiểu',
  VAN_DUNG: 'Vận dụng',
  VAN_DUNG_CAO: 'Vận dụng cao'
};

export const PART_LABELS: Record<PartType, string> = {
  PART_I: 'Phần I: Trắc nghiệm 4 lựa chọn (A, B, C, D)',
  PART_II: 'Phần II: Trắc nghiệm Đúng / Sai (a, b, c, d)',
  PART_III: 'Phần III: Trắc nghiệm trả lời ngắn'
};
