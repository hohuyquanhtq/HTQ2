import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Exam, StudentAnswers, ExamResult } from '../types';
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
  GraduationCap
} from 'lucide-react';

interface OnlineExamViewProps {
  exam: Exam;
  onFinishExam: (result: ExamResult) => void;
  onExitExam: () => void;
}

export const OnlineExamView: React.FC<OnlineExamViewProps> = ({
  exam,
  onFinishExam,
  onExitExam
}) => {
  // Student identification
  const [studentName, setStudentName] = useState('Nguyễn Văn An');
  const [studentClass, setStudentClass] = useState('11 Hóa');
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

  const [activeQuestionId, setActiveQuestionId] = useState<string>(
    exam.questions[0]?.id || ''
  );
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
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
          // Auto submit on time expiry!
          handleSubmitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  // Submit Handler
  const handleSubmitExam = (isAuto: boolean = false) => {
    setIsSubmitModalOpen(false);
    const timeSpent = totalSeconds - secondsRemaining;
    const result = gradeExam(
      exam,
      studentName,
      studentClass,
      answers,
      timeSpent,
      startTimeRef.current
    );

    // Clear active test answers from storage
    localStorage.removeItem(storageKey);
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
    // Limit to max 4 chars by default according to official GDPT 2018 format
    const trimmed = val.slice(0, 6);
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

  // Calculate answered count
  const answeredStats = useMemo(() => {
    let answered = 0;
    exam.questions.forEach((q) => {
      const ans = answers[q.id];
      if (!ans) return;
      if (q.part === 'PART_I' && ans.selectedOption) answered++;
      else if (q.part === 'PART_II') {
        // Complete if all items have answers
        const answeredItems = Object.keys(ans.subItems || {}).length;
        if (answeredItems > 0) answered++;
      } else if (q.part === 'PART_III' && ans.shortAnswerText?.trim()) {
        answered++;
      }
    });
    return {
      answered,
      unanswered: exam.questions.length - answered,
      total: exam.questions.length
    };
  }, [answers, exam.questions]);

  // Jump to next/prev
  const currentIndex = exam.questions.findIndex((q) => q.id === activeQuestionId);

  // If locked by passcode
  if (!isPasscodeUnlocked) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6 text-center">
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
              className="w-full px-4 py-2.5 text-center text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
              className="w-1/2 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Quay lại
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
            >
              Mở khóa & Bắt đầu
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Floating Exam Control Strip */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Exam info & Student name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 line-clamp-1">{exam.title}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-700">{studentName} ({studentClass})</span>
                <span aria-hidden="true">·</span>
                <span>{exam.questions.length} câu</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Save className="w-3 h-3 text-emerald-600" /> Tự động lưu: {lastSavedTime}
                </span>
              </div>
            </div>
          </div>

          {/* Timer & Submit CTA */}
          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
            {/* Countdown Badge */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm tabular-nums border transition-colors ${
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

            {/* Submit Button */}
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp bài thi</span>
            </button>
          </div>
        </div>

        {/* Linear Progress of Time Remaining */}
        <div className="w-full bg-slate-100 rounded-full h-1 mt-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              isTimeCritical ? 'bg-rose-600' : isTimeUrgent ? 'bg-amber-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${(secondsRemaining / totalSeconds) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Examination Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Question Sheet (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {exam.questions.map((q, idx) => {
            const isCurrent = q.id === activeQuestionId;
            const qAnswer = answers[q.id];

            return (
              <div
                key={q.id}
                id={`q-anchor-${q.id}`}
                className={`bg-white rounded-2xl border transition-all p-6 ${
                  isCurrent
                    ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-md'
                    : 'border-slate-200 shadow-xs'
                }`}
                onClick={() => setActiveQuestionId(q.id)}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-sm flex items-center justify-center tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-900">
                        {q.part === 'PART_I'
                          ? 'Phần I: 4 Lựa chọn'
                          : q.part === 'PART_II'
                          ? 'Phần II: Đúng / Sai'
                          : 'Phần III: Trả lời ngắn'}
                      </span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {q.customLevelTag || `[${q.level}]`}
                      </span>
                      {q.chapter && (
                        <>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span>{q.chapter}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Prompt */}
                <div className="py-4 text-base text-slate-900 leading-relaxed font-normal">
                  <MathView content={q.content} />
                </div>

                {/* Embedded Images / Diagrams */}
                {q.images && q.images.length > 0 && (
                  <div className="flex flex-wrap gap-3 pb-3">
                    {q.images.map((imgSrc, imgIdx) => (
                      <img
                        key={imgIdx}
                        src={imgSrc}
                        alt="Hình vẽ minh họa đề thi"
                        className="max-h-60 max-w-full rounded-lg border border-slate-200 object-contain bg-white shadow-xs"
                      />
                    ))}
                  </div>
                )}

                {/* Interactive Answer Input based on Type */}

                {/* Part I: A, B, C, D */}
                {q.part === 'PART_I' && q.options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {q.options.map((opt) => {
                      const isSelected = qAnswer?.selectedOption === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => handleSelectOption(q.id, opt.label)}
                          className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-medium ring-1 ring-indigo-500 shadow-xs'
                              : 'bg-slate-50/50 hover:bg-slate-100/70 border-slate-200 text-slate-800'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-slate-300 text-slate-700'
                            }`}
                          >
                            {opt.label}
                          </span>
                          <div className="flex-1 text-sm pt-0.5">
                            <MathView content={opt.content} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Part II: a, b, c, d True/False Toggles */}
                {q.part === 'PART_II' && q.items && (
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-medium text-slate-500 italic mb-1">
                      Chọn Đúng (Đ) hoặc Sai (S) cho từng nhận định dưới đây:
                    </div>
                    {q.items.map((item) => {
                      const currentVal = qAnswer?.subItems?.[item.label];
                      const isTrue = currentVal === 'D';
                      const isFalse = currentVal === 'S';

                      return (
                        <div
                          key={item.label}
                          className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                        >
                          <div className="flex items-start gap-2.5 flex-1">
                            <span className="font-bold text-slate-900 text-xs shrink-0 mt-0.5">
                              {item.label})
                            </span>
                            <div className="text-slate-800 text-sm">
                              <MathView content={item.content} />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSelectTrueFalse(q.id, item.label, 'D')}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isTrue
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              Đúng (Đ)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectTrueFalse(q.id, item.label, 'S')}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isFalse
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              Sai (S)
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Part III: Short Answer Numeric/String Input */}
                {q.part === 'PART_III' && (
                  <div className="pt-2">
                    <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                      <div className="text-xs font-semibold text-amber-900">
                        Nhập đáp số (tối đa 4 ký tự, dùng dấu phẩy hoặc chấm cho số thập phân):
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          maxLength={6}
                          value={qAnswer?.shortAnswerText || ''}
                          onChange={(e) => handleShortAnswerChange(q.id, e.target.value)}
                          placeholder="VD: 2,5"
                          className="w-48 px-4 py-2 text-base font-mono font-bold bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        <span className="text-xs text-slate-400">
                          ({qAnswer?.shortAnswerText?.length || 0}/4 ký tự)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Sticky Bubble Sheet (4 cols) */}
        <div className="lg:col-span-4 sticky top-36 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Phiếu trả lời trắc nghiệm
              </h3>
              <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md tabular-nums">
                Đã làm: {answeredStats.answered} / {answeredStats.total}
              </div>
            </div>

            {/* Answer Grid by Question */}
            <div className="space-y-4">
              {/* Part I section in grid */}
              {exam.questions.some((q) => q.part === 'PART_I') && (
                <div>
                  <div className="text-xs font-bold text-slate-600 mb-2">Phần I (Trắc nghiệm A-D)</div>
                  <div className="grid grid-cols-4 gap-2">
                    {exam.questions
                      .filter((q) => q.part === 'PART_I')
                      .map((q, idx) => {
                        const isDone = !!answers[q.id]?.selectedOption;
                        const isCurrent = q.id === activeQuestionId;

                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => {
                              setActiveQuestionId(q.id);
                              document.getElementById(`q-anchor-${q.id}`)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                              isCurrent
                                ? 'ring-2 ring-indigo-500 border-indigo-500'
                                : ''
                            } ${
                              isDone
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span className="text-[10px] opacity-80">Câu {idx + 1}</span>
                            <span>{answers[q.id]?.selectedOption || '—'}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Part II section in grid */}
              {exam.questions.some((q) => q.part === 'PART_II') && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-600 mb-2">Phần II (Đúng / Sai)</div>
                  <div className="space-y-2">
                    {exam.questions
                      .filter((q) => q.part === 'PART_II')
                      .map((q, idx) => {
                        const sub = answers[q.id]?.subItems || {};
                        const doneCount = Object.keys(sub).length;
                        const isCurrent = q.id === activeQuestionId;

                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => {
                              setActiveQuestionId(q.id);
                              document.getElementById(`q-anchor-${q.id}`)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`w-full p-2.5 rounded-lg border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                              isCurrent ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
                            } ${
                              doneCount === 4
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                                : doneCount > 0
                                ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="font-bold">Câu {idx + 1} (a,b,c,d)</span>
                            <div className="flex items-center gap-1 font-mono text-xs">
                              <span className={sub['a'] ? 'font-bold text-slate-900' : 'text-slate-300'}>a:{sub['a'] || '-'}</span>
                              <span>·</span>
                              <span className={sub['b'] ? 'font-bold text-slate-900' : 'text-slate-300'}>b:{sub['b'] || '-'}</span>
                              <span>·</span>
                              <span className={sub['c'] ? 'font-bold text-slate-900' : 'text-slate-300'}>c:{sub['c'] || '-'}</span>
                              <span>·</span>
                              <span className={sub['d'] ? 'font-bold text-slate-900' : 'text-slate-300'}>d:{sub['d'] || '-'}</span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Part III section in grid */}
              {exam.questions.some((q) => q.part === 'PART_III') && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-600 mb-2">Phần III (Trả lời ngắn)</div>
                  <div className="grid grid-cols-2 gap-2">
                    {exam.questions
                      .filter((q) => q.part === 'PART_III')
                      .map((q, idx) => {
                        const val = answers[q.id]?.shortAnswerText;
                        const isDone = !!val && val.trim() !== '';
                        const isCurrent = q.id === activeQuestionId;

                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => {
                              setActiveQuestionId(q.id);
                              document.getElementById(`q-anchor-${q.id}`)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`p-2 rounded-lg border text-xs transition-all flex flex-col items-center justify-center cursor-pointer ${
                              isCurrent ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
                            } ${
                              isDone
                                ? 'bg-amber-500 text-white font-bold border-amber-600'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span className="text-[10px] opacity-80">Câu {idx + 1}</span>
                            <span className="font-mono truncate max-w-[80px]">{val || '—'}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-around text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-indigo-600" />
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-200" />
                <span>Chưa làm</span>
              </div>
            </div>

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              Nộp bài thi ngay
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận nộp bài thi?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thời gian làm bài vẫn còn {timeFormatted}.
                </p>
              </div>
            </div>

            {/* Completion Status */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Số câu đã trả lời:</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  {answeredStats.answered} / {answeredStats.total} câu
                </span>
              </div>
              {answeredStats.unanswered > 0 && (
                <div className="flex items-center justify-between text-rose-700 font-semibold">
                  <span>Số câu chưa trả lời:</span>
                  <span className="tabular-nums">{answeredStats.unanswered} câu</span>
                </div>
              )}
            </div>

            {answeredStats.unanswered > 0 && (
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn vẫn còn <strong>{answeredStats.unanswered} câu chưa hoàn thành</strong>. Điểm số các câu chưa làm sẽ tính là 0 điểm. Bạn có chắc chắn muốn nộp bài ngay bây giờ?
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={() => handleSubmitExam(false)}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Xác nhận nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineExamView;
