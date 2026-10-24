import React, { useState, useEffect } from 'react';
import { ExamResult, Exam, COGNITIVE_LEVEL_LABELS, CognitiveLevel, QuestionResultStatus } from '../types';
import MathView from './MathView';
import { normalizeTF, isShortAnswerCorrect } from '../utils/gradingEngine';
import confetti from 'canvas-confetti';
import { 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Printer, 
  RotateCcw, 
  ArrowLeft,
  BookOpen,
  Eye,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Calendar,
  User,
  GraduationCap
} from 'lucide-react';

interface ExamResultViewProps {
  result: ExamResult;
  exam: Exam;
  onRetakeExam: () => void;
  onBackToBank: () => void;
}

type ReviewFilter = 'ALL' | 'INCORRECT' | 'CORRECT' | 'PARTIAL_OR_UNANSWERED';

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  result,
  exam,
  onRetakeExam,
  onBackToBank
}) => {
  // View mode: 'SUMMARY' (Bảng kết quả tổng quan) or 'REVIEW' (Xem đáp án & Hướng dẫn giải)
  const [activeMode, setActiveMode] = useState<'SUMMARY' | 'REVIEW'>('SUMMARY');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('ALL');
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  // Celebration confetti if score >= 8.0
  useEffect(() => {
    if (result.totalScore >= 8.0) {
      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // ignore
      }
    }
  }, [result.totalScore]);

  // Formatted date string for submission
  const submittedDateFormatted = (() => {
    try {
      const d = new Date(result.submittedAt);
      if (isNaN(d.getTime())) return 'Vừa nộp';
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return result.submittedAt || 'Vừa nộp';
    }
  })();

  const minutesSpent = Math.floor(result.timeSpentSeconds / 60);
  const secondsSpent = result.timeSpentSeconds % 60;
  const timeFormatted = `${minutesSpent} phút ${secondsSpent < 10 ? '0' : ''}${secondsSpent} giây`;

  // Score classification rating badge
  const getRatingBadge = (score: number) => {
    if (score >= 9.0) {
      return {
        label: 'Xuất sắc',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs',
        boxClass: 'text-emerald-700 bg-emerald-50 border-emerald-300'
      };
    }
    if (score >= 8.0) {
      return {
        label: 'Giỏi',
        badgeClass: 'bg-teal-100 text-teal-800 border-teal-300 shadow-xs',
        boxClass: 'text-teal-700 bg-teal-50 border-teal-300'
      };
    }
    if (score >= 6.5) {
      return {
        label: 'Khá',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 shadow-xs',
        boxClass: 'text-indigo-700 bg-indigo-50 border-indigo-300'
      };
    }
    if (score >= 5.0) {
      return {
        label: 'Đạt / Trung bình',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 shadow-xs',
        boxClass: 'text-amber-700 bg-amber-50 border-amber-300'
      };
    }
    return {
      label: 'Cần cố gắng',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 shadow-xs',
      boxClass: 'text-rose-700 bg-rose-50 border-rose-300'
    };
  };

  const rating = getRatingBadge(result.totalScore);

  // Sub-items calculation fallback if not already stored in result
  const p2Questions = exam.questions.filter((q) => q.part === 'PART_II');
  let fallbackSubTotal = 0;
  let fallbackSubCorrect = 0;
  let fallbackSubIncorrect = 0;
  let fallbackSubUnanswered = 0;

  p2Questions.forEach((q) => {
    const studentSub = result.answers[q.id]?.subItems || {};
    q.items?.forEach((item) => {
      fallbackSubTotal++;
      const sVal = normalizeTF(studentSub[item.label]);
      const stdVal = normalizeTF(item.correctAnswer);
      if (sVal) {
        if (stdVal && sVal === stdVal) {
          fallbackSubCorrect++;
        } else {
          fallbackSubIncorrect++;
        }
      } else {
        fallbackSubUnanswered++;
      }
    });
  });

  const subItemsTotal = result.subItemsTotalCount ?? fallbackSubTotal;
  const subItemsCorrect = result.subItemsCorrectCount ?? fallbackSubCorrect;
  const subItemsIncorrect = result.subItemsIncorrectCount ?? fallbackSubIncorrect;
  const subItemsUnanswered = result.subItemsUnansweredCount ?? fallbackSubUnanswered;

  // Question detail helper
  const getQuestionDetail = (qId: string) => {
    if (result.questionDetails && result.questionDetails[qId]) {
      return result.questionDetails[qId];
    }
    // Fallback on-the-fly calculation
    const q = exam.questions.find((x) => x.id === qId);
    if (!q) {
      return { score: 0, maxScore: 0, status: 'UNANSWERED' as QuestionResultStatus };
    }
    const studentAns = result.answers[qId];
    if (q.part === 'PART_I') {
      const p1Weight = exam.questions.filter((x) => x.part === 'PART_I').length > 0
        ? exam.partPoints.PART_I / exam.questions.filter((x) => x.part === 'PART_I').length
        : 0;
      const isAnswered = !!studentAns?.selectedOption;
      const isCorrect = isAnswered && studentAns?.selectedOption?.toUpperCase() === q.correctOption?.toUpperCase();
      return {
        score: isCorrect ? Math.round(p1Weight * 100) / 100 : 0,
        maxScore: Math.round(p1Weight * 100) / 100,
        status: isCorrect ? ('CORRECT' as QuestionResultStatus) : isAnswered ? ('INCORRECT' as QuestionResultStatus) : ('UNANSWERED' as QuestionResultStatus)
      };
    }
    if (q.part === 'PART_II') {
      const p2Weight = exam.questions.filter((x) => x.part === 'PART_II').length > 0
        ? exam.partPoints.PART_II / exam.questions.filter((x) => x.part === 'PART_II').length
        : 0;
      const subs = studentAns?.subItems || {};
      let c = 0;
      let ansCount = 0;
      q.items?.forEach((it) => {
        const sVal = normalizeTF(subs[it.label]);
        const aVal = normalizeTF(it.correctAnswer);
        if (sVal) {
          ansCount++;
          if (aVal && sVal === aVal) c++;
        }
      });
      let factor = 0;
      if (c === 1) factor = 0.1;
      else if (c === 2) factor = 0.25;
      else if (c === 3) factor = 0.5;
      else if (c === 4) factor = 1.0;
      const score = Math.round(p2Weight * factor * 100) / 100;
      const totalSubs = q.items ? q.items.length : 4;
      const status: QuestionResultStatus = c === totalSubs ? 'CORRECT' : c > 0 ? 'PARTIAL' : ansCount > 0 ? 'INCORRECT' : 'UNANSWERED';
      return {
        score,
        maxScore: Math.round(p2Weight * 100) / 100,
        status,
        correctSubCount: c,
        totalSubCount: totalSubs
      };
    }
    // Part III
    const p3Weight = exam.questions.filter((x) => x.part === 'PART_III').length > 0
      ? exam.partPoints.PART_III / exam.questions.filter((x) => x.part === 'PART_III').length
      : 0;
    const isAns = !!(studentAns?.shortAnswerText && studentAns.shortAnswerText.trim() !== '');
    const isCorr = isAns && isShortAnswerCorrect(studentAns?.shortAnswerText || '', q.shortAnswer || '');
    return {
      score: isCorr ? Math.round(p3Weight * 100) / 100 : 0,
      maxScore: Math.round(p3Weight * 100) / 100,
      status: isCorr ? ('CORRECT' as QuestionResultStatus) : isAns ? ('INCORRECT' as QuestionResultStatus) : ('UNANSWERED' as QuestionResultStatus)
    };
  };

  const toggleExpl = (qId: string) => {
    setExpandedExplanations((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const expandAllExpl = () => {
    const all: Record<string, boolean> = {};
    exam.questions.forEach((q) => {
      all[q.id] = true;
    });
    setExpandedExplanations(all);
  };

  const collapseAllExpl = () => {
    setExpandedExplanations({});
  };

  const jumpToQuestion = (idx: number) => {
    setActiveMode('REVIEW');
    setTimeout(() => {
      const el = document.getElementById(`review-question-${idx}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Filtered questions in Review mode
  const filteredQuestions = exam.questions.map((q, idx) => ({ q, idx })).filter(({ q }) => {
    if (reviewFilter === 'ALL') return true;
    const detail = getQuestionDetail(q.id);
    if (reviewFilter === 'CORRECT') return detail.status === 'CORRECT';
    if (reviewFilter === 'INCORRECT') return detail.status === 'INCORRECT';
    if (reviewFilter === 'PARTIAL_OR_UNANSWERED') return detail.status === 'PARTIAL' || detail.status === 'UNANSWERED';
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Mode Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMode('SUMMARY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'SUMMARY'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>BẢNG KẾT QUẢ TỔNG QUAN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('REVIEW')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'REVIEW'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>XEM ĐÁP ÁN & HƯỚNG DẪN GIẢI</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pr-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="In kết quả bài làm"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">In kết quả</span>
          </button>
          <button
            type="button"
            onClick={onBackToBank}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về danh sách đề</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: BẢNG KẾT QUẢ TỔNG QUAN (Summary Dashboard) */}
      {/* ========================================================================= */}
      {activeMode === 'SUMMARY' && (
        <div className="space-y-6">
          {/* Main Result Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
            {/* Header / Title */}
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" />
                <span>KẾT QUẢ BÀI THI</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {result.examTitle}
              </h2>

              {/* Student Metadata Bar */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 py-2 px-4 rounded-2xl max-w-lg mx-auto">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Học sinh:</span>
                  <strong className="text-slate-900 font-bold">{result.studentName || 'Chưa khai báo'}</strong>
                </div>
                {result.studentClass && (
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>Lớp:</span>
                    <strong className="text-slate-900 font-bold">{result.studentClass}</strong>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nộp lúc:</span>
                  <strong className="text-slate-900 font-semibold">{submittedDateFormatted}</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Thời gian làm:</span>
                  <strong className="text-slate-900 font-semibold">{timeFormatted}</strong>
                </div>
              </div>

              {/* Score Box */}
              <div className="py-4">
                <div className={`inline-flex flex-col items-center justify-center px-12 py-7 rounded-3xl border-2 ${rating.boxClass}`}>
                  <div className="text-5xl sm:text-6xl font-black tabular-nums tracking-tight">
                    {result.totalScore.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider mt-1 opacity-80">
                    Thang điểm 10,00
                  </div>
                  <div className="mt-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${rating.badgeClass}`}>
                      Xếp loại: {rating.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Part Scores Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto pt-1">
                <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-center">
                  <div className="text-[11px] font-semibold text-indigo-700">Phần I (Trắc nghiệm A,B,C,D)</div>
                  <div className="text-lg font-black text-indigo-950 mt-1 tabular-nums">
                    {result.part1Score.toFixed(2).replace('.', ',')} / {exam.partPoints.PART_I.toFixed(2).replace('.', ',')} đ
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-center">
                  <div className="text-[11px] font-semibold text-emerald-700">Phần II (Đúng / Sai)</div>
                  <div className="text-lg font-black text-emerald-950 mt-1 tabular-nums">
                    {result.part2Score.toFixed(2).replace('.', ',')} / {exam.partPoints.PART_II.toFixed(2).replace('.', ',')} đ
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-center">
                  <div className="text-[11px] font-semibold text-amber-700">Phần III (Trả lời ngắn)</div>
                  <div className="text-lg font-black text-amber-950 mt-1 tabular-nums">
                    {result.part3Score.toFixed(2).replace('.', ',')} / {exam.partPoints.PART_III.toFixed(2).replace('.', ',')} đ
                  </div>
                </div>
              </div>

              {/* PROMINENT PRIMARY CALL-TO-ACTION BUTTON */}
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => setActiveMode('REVIEW')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer group"
                >
                  <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>XEM ĐÁP ÁN VÀ HƯỚNG DẪN GIẢI</span>
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  Bấm để tra cứu đáp án chuẩn, so sánh câu trả lời và xem hướng dẫn giải chi tiết từng câu.
                </p>
              </div>
            </div>
          </div>

          {/* Metrics Row: Question Counts & True/False Sub-items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Question Statistics */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Thống kê câu hỏi ({exam.questions.length} câu)
                </h3>
                <span className="text-xs text-slate-500">Chuẩn GDPT 2018</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-slate-700 font-semibold">Đúng hoàn toàn</span>
                  </div>
                  <span className="font-extrabold text-emerald-800 text-sm tabular-nums">
                    {result.correctCount} câu
                  </span>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-slate-700 font-semibold">Đúng một phần</span>
                  </div>
                  <span className="font-extrabold text-amber-800 text-sm tabular-nums">
                    {result.partialCount} câu
                  </span>
                </div>

                <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="text-slate-700 font-semibold">Sai</span>
                  </div>
                  <span className="font-extrabold text-rose-800 text-sm tabular-nums">
                    {result.incorrectCount} câu
                  </span>
                </div>

                <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-slate-700 font-semibold">Chưa làm</span>
                  </div>
                  <span className="font-extrabold text-slate-800 text-sm tabular-nums">
                    {result.unansweredCount} câu
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed pt-1">
                Lưu ý: &ldquo;Đúng một phần&rdquo; áp dụng cho các câu trắc nghiệm Đúng/Sai (Phần II) học sinh trả lời đúng từ 1 đến 3 ý.
              </div>
            </div>

            {/* True/False Sub-items Statistics (Phần II) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Thống kê từng ý Đúng / Sai (Phần II)
                </h3>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Tổng {subItemsTotal} ý phát biểu
                </span>
              </div>

              {subItemsTotal > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2.5 text-xs text-center">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="text-emerald-700 font-medium text-[11px]">Số ý đúng</div>
                      <div className="text-base font-extrabold text-emerald-900 mt-0.5 tabular-nums">
                        {subItemsCorrect} / {subItemsTotal}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                        {Math.round((subItemsCorrect / subItemsTotal) * 100)}%
                      </div>
                    </div>

                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                      <div className="text-rose-700 font-medium text-[11px]">Số ý sai</div>
                      <div className="text-base font-extrabold text-rose-900 mt-0.5 tabular-nums">
                        {subItemsIncorrect} / {subItemsTotal}
                      </div>
                      <div className="text-[10px] text-rose-600 font-bold mt-0.5">
                        {Math.round((subItemsIncorrect / subItemsTotal) * 100)}%
                      </div>
                    </div>

                    <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                      <div className="text-slate-600 font-medium text-[11px]">Chưa chọn</div>
                      <div className="text-base font-extrabold text-slate-800 mt-0.5 tabular-nums">
                        {subItemsUnanswered} / {subItemsTotal}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                        {Math.round((subItemsUnanswered / subItemsTotal) * 100)}%
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                    <strong>Quy tắc tính điểm Phần II (Bộ GD&ĐT 2018):</strong>
                    <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] font-semibold text-slate-700">
                      <span className="p-1 bg-white rounded border border-slate-200 text-center">1 ý: 0,1 đ</span>
                      <span className="p-1 bg-white rounded border border-slate-200 text-center">2 ý: 0,25 đ</span>
                      <span className="p-1 bg-white rounded border border-slate-200 text-center">3 ý: 0,50 đ</span>
                      <span className="p-1 bg-white rounded border border-slate-200 text-center">4 ý: 1,00 đ</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  Đề thi này không có câu hỏi trắc nghiệm Đúng / Sai (Phần II).
                </div>
              )}
            </div>
          </div>

          {/* Cognitive Level Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Phân tích theo 4 mức độ nhận thức
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'] as CognitiveLevel[]).map((lvl) => {
                const data = result.byLevel[lvl];
                const pct = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;

                return (
                  <div key={lvl} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {COGNITIVE_LEVEL_LABELS[lvl]} ({data.total} câu)
                      </span>
                      <span className="font-extrabold text-indigo-700 tabular-nums">
                        {data.score.toFixed(2).replace('.', ',')} / {data.maxScore.toFixed(2).replace('.', ',')} đ ({pct}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>Đúng hoàn toàn: <strong>{data.correct}</strong> / {data.total} câu</span>
                      <span>Hiệu suất: {pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={onBackToBank}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách đề thi</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onRetakeExam}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm lại bài thi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: XEM ĐÁP ÁN VÀ HƯỚNG DẪN GIẢI (Review Mode) */}
      {/* ========================================================================= */}
      {activeMode === 'REVIEW' && (
        <div className="space-y-6">
          {/* Review Mode Sticky Navigation / Control Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <span>ĐÁP ÁN VÀ HƯỚNG DẪN GIẢI CHI TIẾT</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chế độ chỉ đọc: So sánh đáp án của bạn và đáp án chuẩn theo từng câu hỏi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAllExpl}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                >
                  Mở tất cả lời giải
                </button>
                <button
                  type="button"
                  onClick={collapseAllExpl}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Thu gọn
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('SUMMARY')}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại kết quả</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-500 font-semibold mr-1">Bộ lọc:</span>
                <button
                  type="button"
                  onClick={() => setReviewFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reviewFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({exam.questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter('INCORRECT')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reviewFilter === 'INCORRECT'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Chỉ câu sai ({result.incorrectCount})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter('CORRECT')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reviewFilter === 'CORRECT'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Chỉ câu đúng ({result.correctCount})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter('PARTIAL_OR_UNANSWERED')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reviewFilter === 'PARTIAL_OR_UNANSWERED'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Làm một phần / Chưa làm ({result.partialCount + result.unansweredCount})
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                Hiển thị <strong>{filteredQuestions.length}</strong> / {exam.questions.length} câu
              </div>
            </div>

            {/* Question Palette Navigator (Quick Jump to question) */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-slate-700">Điều hướng nhanh đến câu:</span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Đúng
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Đúng 1 phần
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Sai
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Chưa làm
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                {exam.questions.map((q, idx) => {
                  const detail = getQuestionDetail(q.id);
                  let paletteClass = 'bg-slate-200 text-slate-700 hover:bg-slate-300';
                  if (detail.status === 'CORRECT') {
                    paletteClass = 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs';
                  } else if (detail.status === 'PARTIAL') {
                    paletteClass = 'bg-amber-500 text-white hover:bg-amber-600 shadow-xs';
                  } else if (detail.status === 'INCORRECT') {
                    paletteClass = 'bg-rose-500 text-white hover:bg-rose-600 shadow-xs';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => jumpToQuestion(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-transform hover:scale-105 cursor-pointer ${paletteClass}`}
                      title={`Câu ${idx + 1}: ${
                        detail.status === 'CORRECT'
                          ? 'Đúng'
                          : detail.status === 'PARTIAL'
                          ? 'Đúng một phần'
                          : detail.status === 'INCORRECT'
                          ? 'Sai'
                          : 'Chưa làm'
                      } (${detail.score.toFixed(2).replace('.', ',')} đ)`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-5">
            {filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold">Không có câu hỏi nào khớp với bộ lọc hiện tại.</p>
                <button
                  type="button"
                  onClick={() => setReviewFilter('ALL')}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Xem tất cả câu hỏi
                </button>
              </div>
            ) : (
              filteredQuestions.map(({ q, idx }) => {
                const studentAns = result.answers[q.id];
                const detail = getQuestionDetail(q.id);
                const isExplOpen = expandedExplanations[q.id] ?? false;

                // Status Badge Content with both Icon and Text
                const renderStatusBadge = () => {
                  if (detail.status === 'CORRECT') {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Đúng hoàn toàn</span>
                      </span>
                    );
                  }
                  if (detail.status === 'PARTIAL') {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Đã trả lời một phần</span>
                      </span>
                    );
                  }
                  if (detail.status === 'INCORRECT') {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Sai</span>
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Chưa trả lời</span>
                    </span>
                  );
                };

                return (
                  <div
                    key={q.id}
                    id={`review-question-${idx}`}
                    className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4 scroll-mt-6"
                  >
                    {/* Question Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center tabular-nums">
                          {idx + 1}
                        </span>
                        <div className="text-xs text-slate-500">
                          <span className="font-bold text-slate-900">
                            {q.part === 'PART_I'
                              ? 'Phần I: Trắc nghiệm 4 lựa chọn'
                              : q.part === 'PART_II'
                              ? 'Phần II: Đúng / Sai'
                              : 'Phần III: Trả lời ngắn'}
                          </span>
                          <span className="mx-2 text-slate-300">|</span>
                          <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                            {q.customLevelTag || COGNITIVE_LEVEL_LABELS[q.level]}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {renderStatusBadge()}
                        <div className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full tabular-nums">
                          Điểm: <strong className="text-indigo-700">{detail.score.toFixed(2).replace('.', ',')}</strong> / {detail.maxScore.toFixed(2).replace('.', ',')} đ
                        </div>
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <div className="text-sm font-medium text-slate-900 leading-relaxed pt-1">
                      <MathView content={q.content} />
                    </div>

                    {/* Embedded Images / Diagrams */}
                    {q.images && q.images.length > 0 && (
                      <div className="flex flex-wrap gap-3 py-2">
                        {q.images.map((imgSrc, imgIdx) => (
                          <img
                            key={imgIdx}
                            src={imgSrc}
                            alt="Hình vẽ minh họa câu hỏi"
                            className="max-h-60 max-w-full rounded-xl border border-slate-200 object-contain bg-white shadow-xs"
                          />
                        ))}
                      </div>
                    )}

                    {/* DẠNG 1: PHẦN I (Trắc nghiệm 4 lựa chọn A, B, C, D) */}
                    {q.part === 'PART_I' && q.options && (
                      <div className="space-y-2 pt-2">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Các phương án lựa chọn:
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {q.options.map((opt) => {
                            const isSelected = studentAns?.selectedOption === opt.label;
                            const isCorrect = q.correctOption?.toUpperCase() === opt.label.toUpperCase();

                            let cardClass = 'bg-slate-50/70 border-slate-200 text-slate-700';
                            let badgeLabel = null;

                            if (isCorrect) {
                              cardClass = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium shadow-xs';
                              badgeLabel = isSelected ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-emerald-600 text-white rounded-md shrink-0">
                                  <Check className="w-3 h-3" /> Bạn chọn (Đúng)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md shrink-0">
                                  <Check className="w-3 h-3" /> Đáp án đúng chuẩn
                                </span>
                              );
                            } else if (isSelected && !isCorrect) {
                              cardClass = 'bg-rose-50 border-rose-400 text-rose-950 font-medium shadow-xs';
                              badgeLabel = (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-rose-600 text-white rounded-md shrink-0">
                                  <X className="w-3 h-3" /> Bạn chọn (Sai)
                                </span>
                              );
                            }

                            return (
                              <div
                                key={opt.label}
                                className={`p-3.5 rounded-2xl border text-xs flex items-start justify-between gap-3 ${cardClass}`}
                              >
                                <div className="flex items-start gap-2.5 flex-1">
                                  <span
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : isSelected
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-white border border-slate-300 text-slate-700'
                                    }`}
                                  >
                                    {opt.label}
                                  </span>
                                  <div className="flex-1 pt-0.5 text-slate-800">
                                    <MathView content={opt.content} />
                                  </div>
                                </div>

                                {badgeLabel}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* DẠNG 2: PHẦN II (Trắc nghiệm Đúng / Sai a, b, c, d) */}
                    {q.part === 'PART_II' && q.items && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-500 uppercase tracking-wider">
                            Chi tiết từng phát biểu Đúng / Sai:
                          </span>
                          <span className="font-bold text-slate-700 text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                            Đúng {detail.correctSubCount ?? 0} / {detail.totalSubCount ?? q.items.length} ý
                          </span>
                        </div>

                        <div className="space-y-2">
                          {q.items.map((item) => {
                            const userVal = studentAns?.subItems?.[item.label];
                            const correctVal = item.correctAnswer;
                            const normUser = normalizeTF(userVal);
                            const normCorrect = normalizeTF(correctVal);

                            const isAnswered = !!normUser;
                            const isCorrect = isAnswered && !!normCorrect && normUser === normCorrect;

                            return (
                              <div
                                key={item.label}
                                className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                  !isAnswered
                                    ? 'bg-slate-50 border-slate-200'
                                    : isCorrect
                                    ? 'bg-emerald-50/70 border-emerald-200'
                                    : 'bg-rose-50/70 border-rose-200'
                                }`}
                              >
                                <div className="flex items-start gap-2.5 flex-1">
                                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                                    {item.label})
                                  </span>
                                  <div className="text-slate-800 pt-0.5">
                                    <MathView content={item.content} />
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                                  <div className="text-slate-600 text-[11px]">
                                    Bạn chọn: <strong className="text-slate-900 font-bold">{userVal || '(Chưa chọn)'}</strong>
                                  </div>
                                  <div className="text-slate-600 text-[11px]">
                                    Đáp án chuẩn: <strong className="text-emerald-700 font-bold">{correctVal}</strong>
                                  </div>

                                  {!isAnswered ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-200 text-slate-700 font-bold rounded-md text-[11px]">
                                      Chưa chọn
                                    </span>
                                  ) : isCorrect ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[11px] border border-emerald-300">
                                      <Check className="w-3 h-3 stroke-[3]" /> Đúng
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-md text-[11px] border border-rose-300">
                                      <X className="w-3 h-3 stroke-[3]" /> Sai
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* DẠNG 3: PHẦN III (Trắc nghiệm trả lời ngắn) */}
                    {q.part === 'PART_III' && (() => {
                      const userText = studentAns?.shortAnswerText || '';
                      const isCorrect = isShortAnswerCorrect(userText, q.shortAnswer || '');
                      const isAnswered = userText.trim().length > 0;

                      return (
                        <div className="space-y-3 pt-2">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            So sánh câu trả lời ngắn:
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-slate-600 font-medium">Câu trả lời của bạn:</span>
                              <span
                                className={`font-mono font-bold px-3 py-1.5 rounded-xl border text-sm ${
                                  !isAnswered
                                    ? 'bg-slate-100 text-slate-500 border-slate-300 italic'
                                    : isCorrect
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-400'
                                    : 'bg-rose-50 text-rose-900 border-rose-400'
                                }`}
                              >
                                {isAnswered ? userText : '(Chưa nhập câu trả lời)'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-slate-600 font-medium">Đáp án chuẩn:</span>
                              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-300 text-sm">
                                {q.shortAnswer}
                              </span>

                              {isCorrect ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-300">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Đúng (+{detail.score.toFixed(2).replace('.', ',')} đ)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 font-bold rounded-xl border border-rose-300">
                                  <X className="w-3.5 h-3.5 stroke-[3]" /> Chưa chính xác (0 đ)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* HƯỚNG DẪN GIẢI CHI TIẾT */}
                    <div className="pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => toggleExpl(q.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
                      >
                        {isExplOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span>{isExplOpen ? 'Thu gọn hướng dẫn giải' : 'Xem hướng dẫn giải chi tiết'}</span>
                      </button>

                      {isExplOpen && (
                        <div className="mt-3 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs text-slate-800 leading-relaxed space-y-2">
                          <div className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                            <span>Hướng dẫn giải chi tiết:</span>
                          </div>

                          {q.explanation && q.explanation.trim() !== '' ? (
                            <div className="bg-white p-3.5 rounded-xl border border-indigo-100 text-slate-900 leading-relaxed shadow-2xs">
                              <MathView content={q.explanation} />
                            </div>
                          ) : (
                            <div className="p-3 bg-white/70 rounded-xl border border-slate-200 text-slate-500 italic">
                              Chưa có hướng dẫn giải cho câu hỏi này.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Actions for Review Mode */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setActiveMode('SUMMARY')}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại bảng kết quả</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBackToBank}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <span>Về danh sách đề thi</span>
              </button>

              <button
                type="button"
                onClick={onRetakeExam}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm lại bài thi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamResultView;
