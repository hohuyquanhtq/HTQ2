import React, { useState, useEffect } from 'react';
import { ExamResult, Exam, COGNITIVE_LEVEL_LABELS, CognitiveLevel } from '../types';
import MathView from './MathView';
import confetti from 'canvas-confetti';
import { 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Lock, 
  Unlock, 
  Printer, 
  RotateCcw, 
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from 'lucide-react';

interface ExamResultViewProps {
  result: ExamResult;
  exam: Exam;
  onRetakeExam: () => void;
  onBackToBank: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  result,
  exam,
  onRetakeExam,
  onBackToBank
}) => {
  const [teacherOverride, setTeacherOverride] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  // Trigger celebration confetti if score >= 8.0
  useEffect(() => {
    if (result.totalScore >= 8.0) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // ignore
      }
    }
  }, [result.totalScore]);

  const isUnlocked = result.unlockedExplanation || teacherOverride;

  const minutesSpent = Math.floor(result.timeSpentSeconds / 60);
  const secondsSpent = result.timeSpentSeconds % 60;
  const timeFormatted = `${minutesSpent} phút ${secondsSpent} giây`;

  const toggleExpl = (qId: string) => {
    setExpandedExplanations((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 8.0) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (score >= 6.5) return 'text-indigo-700 bg-indigo-50 border-indigo-300';
    if (score >= 5.0) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-rose-700 bg-rose-50 border-rose-300';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner with Score */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center relative overflow-hidden">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            KẾT QUẢ KIỂM TRA ĐÁNH GIÁ CHUẨN GDPT 2018
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{result.examTitle}</h2>

          <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
            <span>Thí sinh: <strong className="text-slate-800">{result.studentName}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Lớp: <strong className="text-slate-800">{result.studentClass}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Thời gian: <strong className="text-slate-800">{timeFormatted}</strong></span>
          </div>

          {/* Big Score Box */}
          <div className="py-4">
            <div
              className={`inline-flex flex-col items-center justify-center px-10 py-6 rounded-3xl border-2 ${getScoreColor(
                result.totalScore
              )}`}
            >
              <div className="text-5xl font-black tabular-nums tracking-tight">
                {result.totalScore.toFixed(2)}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider mt-1 opacity-80">
                Thang điểm 10.0
              </div>
            </div>
          </div>

          {/* Parts Score Strip */}
          <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg mx-auto">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500">Phần I (Trắc nghiệm)</div>
              <div className="text-base font-bold text-indigo-700 mt-0.5 tabular-nums">
                {result.part1Score.toFixed(2)} / {exam.partPoints.PART_I}đ
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500">Phần II (Đúng/Sai)</div>
              <div className="text-base font-bold text-emerald-700 mt-0.5 tabular-nums">
                {result.part2Score.toFixed(2)} / {exam.partPoints.PART_II}đ
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500">Phần III (Trả lời ngắn)</div>
              <div className="text-base font-bold text-amber-700 mt-0.5 tabular-nums">
                {result.part3Score.toFixed(2)} / {exam.partPoints.PART_III}đ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row: Accuracy & Cognitive Level Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Accuracy Statistics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Thống kê câu trả lời ({exam.questions.length} câu)
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-700 font-medium">Đúng hoàn toàn</span>
              </div>
              <span className="font-bold text-emerald-800 text-sm tabular-nums">
                {result.correctCount}
              </span>
            </div>

            <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span className="text-slate-700 font-medium">Đúng một phần</span>
              </div>
              <span className="font-bold text-indigo-800 text-sm tabular-nums">
                {result.partialCount}
              </span>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span className="text-slate-700 font-medium">Sai</span>
              </div>
              <span className="font-bold text-rose-800 text-sm tabular-nums">
                {result.incorrectCount}
              </span>
            </div>

            <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-500" />
                <span className="text-slate-700 font-medium">Chưa làm</span>
              </div>
              <span className="font-bold text-slate-800 text-sm tabular-nums">
                {result.unansweredCount}
              </span>
            </div>
          </div>
        </div>

        {/* Cognitive Levels Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Phân tích theo 4 mức độ nhận thức
          </h3>
          <div className="space-y-3">
            {(['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'] as CognitiveLevel[]).map((lvl) => {
              const data = result.byLevel[lvl];
              const pct = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;

              return (
                <div key={lvl} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">
                      {COGNITIVE_LEVEL_LABELS[lvl]} ({data.total} câu)
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {data.score.toFixed(2)} / {data.maxScore.toFixed(2)}đ ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Explanation Unlock Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isUnlocked ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {isUnlocked
                  ? 'Đã mở khóa đáp án & Hướng dẫn giải chi tiết'
                  : `Khóa lời giải chi tiết (Yêu cầu tối thiểu ${exam.minScoreForExplanation || 5.0}đ)`}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {isUnlocked
                  ? 'Bạn có thể xem lời giải chi tiết và phân tích từng câu dưới đây.'
                  : `Bạn đạt ${result.totalScore.toFixed(2)}đ. Cần đạt từ ${exam.minScoreForExplanation || 5.0}đ để tự động mở khóa lời giải.`}
              </p>
            </div>
          </div>

          {/* Teacher Mode Unlock Override */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setTeacherOverride(!teacherOverride)}
              className="text-xs text-slate-500 hover:text-indigo-600 underline cursor-pointer"
            >
              {teacherOverride ? 'Tắt chế độ xem giáo viên' : 'Xem với quyền giáo viên'}
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Question Review */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Chi tiết bài làm từng câu</h3>

        {exam.questions.map((q, idx) => {
          const studentAns = result.answers[q.id];
          const isExplOpen = !!expandedExplanations[q.id];

          return (
            <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center tabular-nums">
                    {idx + 1}
                  </span>
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">
                      {q.part === 'PART_I'
                        ? 'Phần I'
                        : q.part === 'PART_II'
                        ? 'Phần II'
                        : 'Phần III'}
                    </span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                      {q.customLevelTag || `[${COGNITIVE_LEVEL_LABELS[q.level].toUpperCase()}]`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prompt */}
              <div className="text-sm font-medium text-slate-900">
                <MathView content={q.content} />
              </div>

              {/* Embedded Images / Diagrams */}
              {q.images && q.images.length > 0 && (
                <div className="flex flex-wrap gap-3 py-2">
                  {q.images.map((imgSrc, imgIdx) => (
                    <img
                      key={imgIdx}
                      src={imgSrc}
                      alt="Hình vẽ minh họa đề thi"
                      className="max-h-56 max-w-full rounded-lg border border-slate-200 object-contain bg-white shadow-xs"
                    />
                  ))}
                </div>
              )}

              {/* Part I Review */}
              {q.part === 'PART_I' && q.options && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = studentAns?.selectedOption === opt.label;
                    const isCorrect = q.correctOption?.toUpperCase() === opt.label.toUpperCase();

                    let style = 'bg-slate-50 border-slate-200 text-slate-700';
                    if (isCorrect) {
                      style = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium';
                    } else if (isSelected && !isCorrect) {
                      style = 'bg-rose-50 border-rose-400 text-rose-950 font-medium';
                    }

                    return (
                      <div
                        key={opt.label}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${style}`}
                      >
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center font-bold shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : isSelected
                              ? 'bg-rose-600 text-white'
                              : 'bg-white border border-slate-300 text-slate-700'
                          }`}
                        >
                          {opt.label}
                        </span>
                        <div className="flex-1 pt-0.5">
                          <MathView content={opt.content} />
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 rounded shrink-0">
                            Bạn chọn
                          </span>
                        )}
                        {isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Part II Review */}
              {q.part === 'PART_II' && q.items && (
                <div className="space-y-2 pt-1">
                  {q.items.map((item) => {
                    const userVal = studentAns?.subItems?.[item.label];
                    const correctVal = item.correctAnswer;
                    const isCorrect = userVal && userVal === correctVal;

                    return (
                      <div
                        key={item.label}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <span className="font-bold text-slate-900">{item.label})</span>
                          <div className="text-slate-800">
                            <MathView content={item.content} />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-slate-500">
                            Bạn chọn: <strong className="text-slate-900">{userVal || '(Trống)'}</strong>
                          </div>
                          <div className="text-slate-500">
                            Đáp án: <strong className="text-emerald-700">{correctVal}</strong>
                          </div>
                          {isCorrect ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                              Đúng
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded">
                              Sai
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Part III Review */}
              {q.part === 'PART_III' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">Câu trả lời của bạn:</span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border">
                      {studentAns?.shortAnswerText || '(Chưa nhập)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">Đáp án chuẩn:</span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300">
                      {q.shortAnswer}
                    </span>
                  </div>
                </div>
              )}

              {/* Explanation section */}
              {isUnlocked && q.explanation && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => toggleExpl(q.id)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    {isExplOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{isExplOpen ? 'Thu gọn lời giải' : 'Xem lời giải chi tiết'}</span>
                  </button>

                  {isExplOpen && (
                    <div className="mt-2.5 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-slate-800 leading-relaxed">
                      <div className="font-bold text-indigo-950 mb-1">Hướng dẫn giải:</div>
                      <MathView content={q.explanation} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <button
          onClick={onBackToBank}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Ngân hàng câu hỏi</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In phiếu điểm</span>
          </button>

          <button
            onClick={onRetakeExam}
            className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm lại bài thi</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamResultView;
