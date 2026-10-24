import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Exam, StudentAnswers, ExamResult, UserSession, Question } from '../types';
import { gradeExam } from '../utils/gradingEngine';
import MathView from './MathView';
import { 
  Clock, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  User,
  GraduationCap,
  Flag,
  Check,
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';

interface OnlineExamViewProps {
  exam: Exam;
  currentUser?: UserSession | null;
  onFinishExam: (result: ExamResult) => void;
  onExitExam: () => void;
}

export type QuestionAnswerStatus = 'ANSWERED' | 'PARTIAL' | 'UNANSWERED';

export const OnlineExamView: React.FC<OnlineExamViewProps> = ({
  exam,
  currentUser,
  onFinishExam,
  onExitExam
}) => {
  // Student identification from currentUser or fallback
  const [studentName, setStudentName] = useState(
    currentUser?.fullName || 'Nguyễn Văn An'
  );
  const [studentClass, setStudentClass] = useState(
    currentUser?.className || (currentUser?.role === 'STUDENT' ? '11 Chuyên Hóa' : '11A1')
  );
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [isPasscodeUnlocked, setIsPasscodeUnlocked] = useState(!exam.passcode);
  const [passcodeError, setPasscodeError] = useState(false);

  // Time & Timer
  const totalSeconds = (exam.durationMinutes || 50) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(!exam.passcode);
  const startTimeRef = useRef<string>(new Date().toISOString());

  // Student Answers
  const storageKey = `educhem_active_exam_${exam.id}`;
  const [answers, setAnswers] = useState<StudentAnswers>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Current Question Index (Single question at a time)
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Flagged/Bookmarked question IDs for review
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  // Submit Modal & Autosave Time
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Vừa lưu');

  // Auto-save to localStorage on answer change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
      const now = new Date();
      setLastSavedTime(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      );
    } catch (err) {
      console.error('Auto save error:', err);
    }
  }, [answers, storageKey]);

  // Timer Countdown
  useEffect(() => {
    if (!isTimerRunning) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  // Current Question object
  const currentQuestion: Question | undefined = exam.questions[currentIndex];

  // Helper to determine the precise answer status of a question:
  // - 'ANSWERED': Fully completed according to question type rules
  // - 'PARTIAL': Answered only some statements for True/False
  // - 'UNANSWERED': No valid answer entered
  const getQuestionStatus = (q: Question): QuestionAnswerStatus => {
    const ans = answers[q.id];
    if (!ans) return 'UNANSWERED';

    if (q.part === 'PART_I') {
      return ans.selectedOption ? 'ANSWERED' : 'UNANSWERED';
    }

    if (q.part === 'PART_II') {
      const subItems = ans.subItems || {};
      const answeredCount = Object.keys(subItems).length;
      const totalItems = q.items ? q.items.length : 4;
      if (answeredCount === totalItems && totalItems > 0) return 'ANSWERED';
      if (answeredCount > 0) return 'PARTIAL';
      return 'UNANSWERED';
    }

    if (q.part === 'PART_III') {
      return (ans.shortAnswerText && ans.shortAnswerText.trim() !== '') ? 'ANSWERED' : 'UNANSWERED';
    }

    return 'UNANSWERED';
  };

  // Toggle flag / bookmark on a question
  const toggleFlagQuestion = (qId: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  // Submit Handler
  const handleSubmitExam = (isAuto: boolean = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setIsTimerRunning(false);
    setIsSubmitModalOpen(false);

    const timeSpent = Math.max(1, totalSeconds - secondsRemaining);
    const result = gradeExam(
      exam,
      studentName,
      studentClass,
      answers,
      timeSpent,
      startTimeRef.current
    );

    // Attach studentId from currentUser if logged in
    if (currentUser?.userId) {
      result.studentId = currentUser.userId;
    }

    // Clear active test answers from storage
    try {
      localStorage.removeItem(storageKey);
    } catch {}

    onFinishExam(result);
  };

  // Passcode unlock
  const handleUnlockPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (exam.passcode && enteredPasscode.trim() === exam.passcode.trim()) {
      setIsPasscodeUnlocked(true);
      setIsTimerRunning(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  };

  // Answer modification helpers
  const handleSelectOption = (qId: string, optLabel: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        selectedOption: optLabel
      }
    }));
  };

  const handleSelectTrueFalse = (qId: string, itemLabel: string, val: 'D' | 'S') => {
    setAnswers((prev) => {
      const currentSub = prev[qId]?.subItems || {};
      return {
        ...prev,
        [qId]: {
          ...prev[qId],
          subItems: {
            ...currentSub,
            [itemLabel]: val
          }
        }
      };
    });
  };

  const handleShortAnswerChange = (qId: string, val: string) => {
    const trimmed = val.slice(0, 10);
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        shortAnswerText: trimmed
      }
    }));
  };

  // Format time remaining
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isTimeUrgent = secondsRemaining < 300; // < 5 mins
  const isTimeCritical = secondsRemaining < 60; // < 1 min

  // Computed Answer Statistics
  const answeredStats = useMemo(() => {
    let fullyAnswered = 0;
    let partiallyAnswered = 0;
    let unanswered = 0;

    const unansweredList: number[] = [];
    const partialList: number[] = [];

    exam.questions.forEach((q, idx) => {
      const st = getQuestionStatus(q);
      if (st === 'ANSWERED') {
        fullyAnswered++;
      } else if (st === 'PARTIAL') {
        partiallyAnswered++;
        partialList.push(idx + 1);
      } else {
        unanswered++;
        unansweredList.push(idx + 1);
      }
    });

    return {
      fullyAnswered,
      partiallyAnswered,
      unanswered,
      total: exam.questions.length,
      unansweredList,
      partialList,
      percentDone: Math.round(((fullyAnswered + partiallyAnswered * 0.5) / exam.questions.length) * 100)
    };
  }, [answers, exam.questions]);

  // If locked by passcode
  if (!isPasscodeUnlocked) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6 text-center animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{exam.title}</h2>
          <p className="text-xs text-slate-500 mt-1">
            Đề thi này được bảo vệ bởi mật khẩu của giáo viên. Vui lòng nhập mã để bắt đầu làm bài.
          </p>
        </div>

        <form onSubmit={handleUnlockPasscode} className="space-y-4">
          <div>
            <input
              type="password"
              value={enteredPasscode}
              onChange={(e) => setEnteredPasscode(e.target.value)}
              placeholder="Nhập mật khẩu đề thi..."
              className="w-full px-4 py-2.5 text-center text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold"
              autoFocus
            />
            {passcodeError && (
              <div className="text-xs text-rose-600 font-medium mt-1.5">
                Mật khẩu không chính xác. Vui lòng kiểm tra lại.
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExitExam}
              className="w-1/2 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Quay lại
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm cursor-pointer"
            >
              Mở khóa & Bắt đầu
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Active question answers
  const activeAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isCurrentFlagged = currentQuestion ? flaggedIds.has(currentQuestion.id) : false;
  const currentStatus = currentQuestion ? getQuestionStatus(currentQuestion) : 'UNANSWERED';

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-16">
      {/* ===================== A. PHẦN ĐẦU TRANG (TOP BAR) ===================== */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Exam info & Student name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate" title={exam.title}>
                {exam.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  {studentName} ({studentClass})
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Câu {currentIndex + 1} / {exam.questions.length}
                </span>
                <span aria-hidden="true" className="hidden sm:inline">·</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
                  <Save className="w-3 h-3 text-emerald-600" /> Tự lưu: {lastSavedTime}
                </span>
              </div>
            </div>
          </div>

          {/* Countdown Timer & Submit CTA */}
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
            {/* Timer Badge */}
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono font-bold text-sm sm:text-base tabular-nums border transition-colors ${
                isTimeCritical
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : isTimeUrgent
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-slate-50 text-slate-900 border-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{timeFormatted}</span>
            </div>

            {/* Quick Submit CTA */}
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Nộp bài thi</span>
            </button>
          </div>
        </div>

        {/* Linear Progress Bar of Exam Completion */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Tiến độ hoàn thành: {answeredStats.fullyAnswered}/{answeredStats.total} câu ({answeredStats.percentDone}%)</span>
            {answeredStats.partiallyAnswered > 0 && (
              <span className="text-amber-700 font-semibold">{answeredStats.partiallyAnswered} câu làm một phần</span>
            )}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${answeredStats.percentDone}%` }}
            />
          </div>
        </div>
      </div>

      {/* ===================== MAIN LAYOUT ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ===================== B. VÙNG NỘI DUNG CHÍNH (SINGLE QUESTION VIEW - 8 cols) ===================== */}
        <div className="lg:col-span-8 space-y-4">
          {currentQuestion ? (
            <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-sm p-6 sm:p-8 space-y-6 transition-all">
              {/* Question Header & Flag Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold text-base flex items-center justify-center tabular-nums shadow-xs">
                    {currentIndex + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs border ${
                        currentQuestion.part === 'PART_I'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : currentQuestion.part === 'PART_II'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {currentQuestion.part === 'PART_I'
                          ? 'Phần I: Trắc nghiệm 4 lựa chọn'
                          : currentQuestion.part === 'PART_II'
                          ? 'Phần II: Đúng / Sai (4 phát biểu a, b, c, d)'
                          : 'Phần III: Trả lời ngắn'}
                      </span>
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
                        {currentQuestion.customLevelTag || `[${currentQuestion.level}]`}
                      </span>
                    </div>
                    {currentQuestion.chapter && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {currentQuestion.chapter}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bookmark / Flag Button */}
                <button
                  type="button"
                  onClick={() => toggleFlagQuestion(currentQuestion.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    isCurrentFlagged
                      ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs ring-1 ring-amber-300'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title={isCurrentFlagged ? 'Bỏ đánh dấu xem lại' : 'Đánh dấu câu này để xem lại sau'}
                >
                  <Flag className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-amber-500 text-amber-600' : 'text-slate-400'}`} />
                  <span>{isCurrentFlagged ? 'Đã đánh dấu xem lại' : 'Đánh dấu xem lại'}</span>
                </button>
              </div>

              {/* Question Prompt (Large, Clear, Responsive Typography) */}
              <div className="text-base sm:text-lg text-slate-900 leading-relaxed font-normal py-2 select-text break-words">
                <MathView content={currentQuestion.content} />
              </div>

              {/* Embedded Diagrams / Images if present */}
              {currentQuestion.images && currentQuestion.images.length > 0 && (
                <div className="flex flex-wrap gap-3 py-2">
                  {currentQuestion.images.map((imgSrc, imgIdx) => (
                    <img
                      key={imgIdx}
                      src={imgSrc}
                      alt="Hình vẽ minh họa câu hỏi"
                      className="max-h-72 max-w-full rounded-xl border border-slate-200 object-contain bg-white shadow-xs p-1"
                    />
                  ))}
                </div>
              )}

              {/* Interactive Answer Input based on Type */}

              {/* DẠNG 1: Trắc nghiệm A, B, C, D */}
              {currentQuestion.part === 'PART_I' && currentQuestion.options && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Chọn một phương án đúng nhất:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = activeAnswer?.selectedOption === opt.label;

                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => handleSelectOption(currentQuestion.id, opt.label)}
                          className={`p-4 rounded-xl border-2 text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/90 border-indigo-600 text-indigo-950 font-medium ring-2 ring-indigo-500/20 shadow-xs'
                              : 'bg-slate-50/70 hover:bg-slate-100/90 border-slate-200 text-slate-800'
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white border border-slate-300 text-slate-700'
                            }`}
                          >
                            {opt.label}
                          </span>
                          <div className="flex-1 text-sm sm:text-base pt-0.5">
                            <MathView content={opt.content} />
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DẠNG 2: Đúng / Sai 4 phát biểu a, b, c, d */}
              {currentQuestion.part === 'PART_II' && currentQuestion.items && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Chọn Đúng hoặc Sai cho từng phát biểu dưới đây:
                  </div>
                  <div className="space-y-2.5">
                    {currentQuestion.items.map((item) => {
                      const currentVal = activeAnswer?.subItems?.[item.label];
                      const isTrue = currentVal === 'D';
                      const isFalse = currentVal === 'S';

                      return (
                        <div
                          key={item.label}
                          className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm sm:text-base ${
                            isTrue
                              ? 'bg-emerald-50/40 border-emerald-300'
                              : isFalse
                              ? 'bg-rose-50/40 border-rose-300'
                              : 'bg-slate-50/70 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <span className="font-extrabold text-slate-900 shrink-0 w-6 text-sm sm:text-base">
                              {item.label})
                            </span>
                            <div className="flex-1 text-slate-800">
                              <MathView content={item.content} />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleSelectTrueFalse(currentQuestion.id, item.label, 'D')}
                              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                                isTrue
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                  : 'bg-white hover:bg-emerald-50 border-slate-300 text-slate-700'
                              }`}
                            >
                              Đúng (Đ)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectTrueFalse(currentQuestion.id, item.label, 'S')}
                              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                                isFalse
                                  ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                                  : 'bg-white hover:bg-rose-50 border-slate-300 text-slate-700'
                              }`}
                            >
                              Sai (S)
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DẠNG 3: Trả lời ngắn */}
              {currentQuestion.part === 'PART_III' && (
                <div className="space-y-3 pt-3">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nhập câu trả lời ngắn dưới dạng số hoặc số thập phân:
                  </div>
                  <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <input
                        type="text"
                        value={activeAnswer?.shortAnswerText || ''}
                        onChange={(e) => handleShortAnswerChange(currentQuestion.id, e.target.value)}
                        placeholder="VD: 0,5 hoặc 12"
                        className="w-full sm:w-64 px-4 py-3 text-lg font-mono font-bold bg-white border-2 border-amber-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                        autoFocus
                      />
                      <span className="text-xs text-slate-500">
                        Hỗ trợ số nguyên, số thập phân (dùng dấu phẩy hoặc dấu chấm: ví dụ 0,5 hoặc 0.5)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== C. ĐIỀU HƯỚNG TỪNG CÂU (BOTTOM NAVIGATION) ===================== */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                    currentIndex === 0
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                {/* Status Indicator for Current Question */}
                <div className="text-center text-xs font-semibold">
                  {currentStatus === 'ANSWERED' && (
                    <span className="text-emerald-700 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đã hoàn thành câu này</span>
                    </span>
                  )}
                  {currentStatus === 'PARTIAL' && (
                    <span className="text-amber-700 flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Mới trả lời một phần</span>
                    </span>
                  )}
                  {currentStatus === 'UNANSWERED' && (
                    <span className="text-slate-500 flex items-center justify-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      <span>Chưa có câu trả lời</span>
                    </span>
                  )}
                </div>

                {currentIndex < exam.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.min(exam.questions.length - 1, prev + 1))}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Câu tiếp theo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all cursor-pointer"
                  >
                    <span>Kiểm tra & Nộp bài</span>
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* ===================== THANH CHỌN CÂU HỎI (QUESTION PALETTE BAR - 4 cols) ===================== */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-36">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            {/* Palette Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Bảng câu hỏi làm bài
                </h3>
                <p className="text-[11px] text-slate-500">
                  Bấm vào số câu để chuyển trực tiếp
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                {answeredStats.fullyAnswered}/{answeredStats.total} câu
              </span>
            </div>

            {/* Questions Grid Palette */}
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 max-h-[55vh] overflow-y-auto p-1">
              {exam.questions.map((q, idx) => {
                const status = getQuestionStatus(q);
                const isCurrent = idx === currentIndex;
                const isFlagged = flaggedIds.has(q.id);

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-11 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center cursor-pointer border ${
                      isCurrent
                        ? 'ring-2 ring-indigo-600 ring-offset-2 border-indigo-600 scale-105 shadow-md z-10'
                        : ''
                    } ${
                      status === 'ANSWERED'
                        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                        : status === 'PARTIAL'
                        ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                    title={`Câu ${idx + 1} (${
                      status === 'ANSWERED'
                        ? 'Đã làm'
                        : status === 'PARTIAL'
                        ? 'Làm một phần'
                        : 'Chưa làm'
                    }${isFlagged ? ' - Cần xem lại' : ''})`}
                  >
                    <span>{idx + 1}</span>

                    {/* Partial badge dot */}
                    {status === 'PARTIAL' && (
                      <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-600" />
                    )}

                    {/* Flagged icon/marker */}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Flag className="w-2.5 h-2.5 fill-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Palette Legend (Chú giải trực quan) */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                Chú giải trạng thái:
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-600 shrink-0" />
                  <span>Đã làm xong ({answeredStats.fullyAnswered})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-400 text-amber-900 shrink-0 flex items-center justify-center text-[9px] font-bold">½</span>
                  <span>Làm một phần ({answeredStats.partiallyAnswered})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 shrink-0" />
                  <span>Chưa làm ({answeredStats.unanswered})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Flag className="w-2 h-2 fill-white" />
                  </span>
                  <span>Cần xem lại ({flaggedIds.size})</span>
                </div>
              </div>
            </div>

            {/* Bottom Submit Button */}
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Nộp bài thi ngay</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== SUBMIT CONFIRMATION MODAL ===================== */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full my-8 p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start gap-3.5 border-b border-slate-100 pb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận nộp bài thi?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thời gian làm bài vẫn còn: <strong className="font-mono text-slate-800">{timeFormatted}</strong>
                </p>
              </div>
            </div>

            {/* Student Info Confirmation */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Thông tin thí sinh nộp bài:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">Họ và tên thí sinh</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Họ và tên thí sinh"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">Lớp / Khối</label>
                  <input
                    type="text"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder="Ví dụ: 11A1"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Completion Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Đã trả lời đầy đủ:</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  {answeredStats.fullyAnswered} / {answeredStats.total} câu
                </span>
              </div>
              {answeredStats.partiallyAnswered > 0 && (
                <div className="flex items-center justify-between text-amber-700 font-semibold">
                  <span>Mới làm một phần:</span>
                  <span className="tabular-nums">{answeredStats.partiallyAnswered} câu</span>
                </div>
              )}
              {answeredStats.unanswered > 0 && (
                <div className="flex items-center justify-between text-rose-700 font-semibold">
                  <span>Chưa trả lời:</span>
                  <span className="tabular-nums">{answeredStats.unanswered} câu</span>
                </div>
              )}
            </div>

            {/* Unfinished Questions Warning Banner */}
            {(answeredStats.unanswered > 0 || answeredStats.partiallyAnswered > 0) && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    Còn {answeredStats.unanswered + answeredStats.partiallyAnswered} câu chưa hoàn thành:
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto py-1">
                  {answeredStats.unansweredList.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(num - 1);
                        setIsSubmitModalOpen(false);
                      }}
                      className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold font-mono text-[11px] cursor-pointer"
                      title="Bấm để chuyển ngay đến câu này"
                    >
                      Câu {num}
                    </button>
                  ))}
                  {answeredStats.partialList.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(num - 1);
                        setIsSubmitModalOpen(false);
                      }}
                      className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold font-mono text-[11px] cursor-pointer"
                      title="Bấm để chuyển ngay đến câu làm một phần này"
                    >
                      Câu {num} (½)
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Các câu chưa làm sẽ nhận 0 điểm cho câu đó. Thầy/Cô và các bạn có chắc chắn muốn nộp bài ngay bây giờ?
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Quay lại làm tiếp
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitExam(false)}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? 'Đang chấm điểm & nộp bài...' : 'Xác nhận nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineExamView;
