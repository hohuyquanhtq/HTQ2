import React, { useState, useMemo } from 'react';
import { 
  Question, 
  Exam, 
  ExamMatrixConfig, 
  CognitiveLevel, 
  COGNITIVE_LEVEL_LABELS,
  MultipleChoiceOption 
} from '../types';
import MathView from './MathView';
import { 
  Grid, 
  Play, 
  Printer, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Shuffle, 
  Clock, 
  Lock, 
  FileCheck,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface ExamMatrixViewProps {
  questions: Question[];
  exams: Exam[];
  onSaveExam: (exam: Exam) => void;
  onDeleteExam: (examId: string) => void;
  onStartExam: (exam: Exam) => void;
}

export const ExamMatrixView: React.FC<ExamMatrixViewProps> = ({
  questions,
  exams,
  onSaveExam,
  onDeleteExam,
  onStartExam
}) => {
  // Matrix Form State
  const [title, setTitle] = useState('Đề kiểm tra Hóa học 11 - Định kì GDPT 2018');
  const [subject, setSubject] = useState('Hóa học');
  const [grade, setGrade] = useState(11);
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [passcode, setPasscode] = useState('');
  const [minScoreForExplanation, setMinScoreForExplanation] = useState(5.0);

  // Question counts & weights
  const [part1Count, setPart1Count] = useState(8);
  const [part1Points, setPart1Points] = useState(4.0);

  const [part2Count, setPart2Count] = useState(2);
  const [part2Points, setPart2Points] = useState(3.0);

  const [part3Count, setPart3Count] = useState(2);
  const [part3Points, setPart3Points] = useState(3.0);

  // Cognitive distribution
  const [levelCounts, setLevelCounts] = useState<{
    NHAN_BIET: number;
    THONG_HIEU: number;
    VAN_DUNG: number;
    VAN_DUNG_CAO: number;
  }>({
    NHAN_BIET: 2,
    THONG_HIEU: 3,
    VAN_DUNG: 4,
    VAN_DUNG_CAO: 3
  });

  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  // Selected exam for preview/printing
  const [viewingExam, setViewingExam] = useState<Exam | null>(null);

  // Bank availability calculation
  const bankStats = useMemo(() => {
    const verifiedQuestions = questions.filter((q) => q.isVerified);
    const p1Available = verifiedQuestions.filter((q) => q.part === 'PART_I').length;
    const p2Available = verifiedQuestions.filter((q) => q.part === 'PART_II').length;
    const p3Available = verifiedQuestions.filter((q) => q.part === 'PART_III').length;

    const levelStats = {
      NHAN_BIET: verifiedQuestions.filter((q) => q.level === 'NHAN_BIET').length,
      THONG_HIEU: verifiedQuestions.filter((q) => q.level === 'THONG_HIEU').length,
      VAN_DUNG: verifiedQuestions.filter((q) => q.level === 'VAN_DUNG').length,
      VAN_DUNG_CAO: verifiedQuestions.filter((q) => q.level === 'VAN_DUNG_CAO').length
    };

    return {
      p1Available,
      p2Available,
      p3Available,
      levelStats,
      totalVerified: verifiedQuestions.length
    };
  }, [questions]);

  const totalPoints = Math.round((part1Points + part2Points + part3Points) * 10) / 10;
  const totalQuestionsNeeded = part1Count + part2Count + part3Count;
  const totalLevelsPlanned = levelCounts.NHAN_BIET + levelCounts.THONG_HIEU + levelCounts.VAN_DUNG + levelCounts.VAN_DUNG_CAO;

  // Validation
  const canGenerate = useMemo(() => {
    if (part1Count > bankStats.p1Available) return false;
    if (part2Count > bankStats.p2Available) return false;
    if (part3Count > bankStats.p3Available) return false;
    if (totalQuestionsNeeded === 0) return false;
    return true;
  }, [part1Count, part2Count, part3Count, bankStats, totalQuestionsNeeded]);

  // Generate Exam
  const handleGenerateExam = () => {
    if (!canGenerate) return;

    const verified = questions.filter((q) => q.isVerified);
    const p1Pool = [...verified.filter((q) => q.part === 'PART_I')];
    const p2Pool = [...verified.filter((q) => q.part === 'PART_II')];
    const p3Pool = [...verified.filter((q) => q.part === 'PART_III')];

    // Helper to shuffle array
    const shuffleArray = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const selectedP1 = (shuffleQuestions ? shuffleArray(p1Pool) : p1Pool).slice(0, part1Count);
    const selectedP2 = (shuffleQuestions ? shuffleArray(p2Pool) : p2Pool).slice(0, part2Count);
    const selectedP3 = (shuffleQuestions ? shuffleArray(p3Pool) : p3Pool).slice(0, part3Count);

    // Shuffle options for Part I if requested, keeping track of correctOption
    const finalP1 = selectedP1.map((q) => {
      if (!shuffleOptions || !q.options || q.options.length === 0) return q;

      const originalCorrectOption = q.options.find((o) => o.label === q.correctOption);
      const shuffledOptionsContent = shuffleArray(q.options.map((o) => o.content));
      const labels: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

      const newOptions: MultipleChoiceOption[] = shuffledOptionsContent.map((content, idx) => ({
        label: labels[idx],
        content
      }));

      let newCorrectLabel = q.correctOption;
      if (originalCorrectOption) {
        const found = newOptions.find((o) => o.content === originalCorrectOption.content);
        if (found) newCorrectLabel = found.label;
      }

      return {
        ...q,
        options: newOptions,
        correctOption: newCorrectLabel
      };
    });

    const finalQuestions = [...finalP1, ...selectedP2, ...selectedP3];

    const newExam: Exam = {
      id: `exam-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim() || 'Đề kiểm tra Hóa học 11',
      subject,
      grade,
      durationMinutes,
      passcode: passcode.trim() || undefined,
      minScoreForExplanation,
      partPoints: {
        PART_I: part1Points,
        PART_II: part2Points,
        PART_III: part3Points
      },
      questions: finalQuestions,
      createdAt: new Date().toISOString()
    };

    onSaveExam(newExam);
    setViewingExam(newExam);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Sinh đề thi theo Ma trận chuẩn GDPT 2018
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Cấu hình số câu, trọng số điểm từng phần và mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).
          Hệ thống tự động kiểm tra lượng câu hỏi khả dụng trong ngân hàng, cảnh báo nếu thiếu câu và hỗ trợ xáo trộn đề linh hoạt.
        </p>
      </div>

      {/* Main Grid: Form Left, Preview/Bank Check Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              1. Thông tin chung của đề thi
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên đề kiểm tra</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Hóa học">Hóa học</option>
                    <option value="Toán học">Toán học</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value={10}>Lớp 10</option>
                    <option value={11}>Lớp 11</option>
                    <option value={12}>Lớp 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mật khẩu truy cập (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Để trống nếu không khóa"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Điểm tối thiểu để xem lời giải
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={10}
                    value={minScoreForExplanation}
                    onChange={(e) => setMinScoreForExplanation(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg tabular-nums"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Matrix Question Counts & Weights */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                2. Cấu trúc số câu & Thang điểm từng phần
              </h3>
              <div
                className={`text-xs font-bold px-2.5 py-1 rounded-lg tabular-nums ${
                  totalPoints === 10.0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                Tổng điểm: {totalPoints} / 10.0
              </div>
            </div>

            {totalPoints !== 10.0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Cảnh báo:</strong> Tổng điểm các phần hiện là <strong>{totalPoints}đ</strong> (khác chuẩn 10,0đ). Vui lòng điều chỉnh lại điểm từng phần nếu cần.
                </span>
              </div>
            )}

            <div className="space-y-4">
              {/* Part I Row */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-indigo-700">
                    Phần I: Trắc nghiệm 4 lựa chọn (A, B, C, D)
                  </span>
                  <span className="text-xs text-slate-500 tabular-nums">
                    Có sẵn: {bankStats.p1Available} câu
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Số lượng câu</label>
                    <input
                      type="number"
                      min={0}
                      max={bankStats.p1Available}
                      value={part1Count}
                      onChange={(e) => setPart1Count(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg tabular-nums font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Tổng điểm Phần I</label>
                    <input
                      type="number"
                      step="0.25"
                      min={0}
                      max={10}
                      value={part1Points}
                      onChange={(e) => setPart1Points(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg tabular-nums font-bold"
                    />
                  </div>
                </div>
                {part1Count > 0 && (
                  <div className="text-[11px] text-slate-500">
                    Mỗi câu: ~{(part1Points / part1Count).toFixed(3)} điểm (chuẩn GDPT 12 câu = 3.0đ = 0.25đ/câu)
                  </div>
                )}
              </div>

              {/* Part II Row */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-700">
                    Phần II: Trắc nghiệm Đúng / Sai (a, b, c, d)
                  </span>
                  <span className="text-xs text-slate-500 tabular-nums">
                    Có sẵn: {bankStats.p2Available} câu
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Số lượng câu</label>
                    <input
                      type="number"
                      min={0}
                      max={bankStats.p2Available}
                      value={part2Count}
                      onChange={(e) => setPart2Count(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg tabular-nums font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Tổng điểm Phần II</label>
                    <input
                      type="number"
                      step="0.25"
                      min={0}
                      max={10}
                      value={part2Points}
                      onChange={(e) => setPart2Points(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg tabular-nums font-bold"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  Chấm theo quy tắc lũy tiến Bộ GD&ĐT (1 ý: 10%, 2 ý: 25%, 3 ý: 50%, 4 ý: 100%)
                </div>
              </div>

              {/* Part III Row */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-700">
                    Phần III: Trắc nghiệm trả lời ngắn (Đáp số tối đa 4 ký tự)
                  </span>
                  <span className="text-xs text-slate-500 tabular-nums">
                    Có sẵn: {bankStats.p3Available} câu
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Số lượng câu</label>
                    <input
                      type="number"
                      min={0}
                      max={bankStats.p3Available}
                      value={part3Count}
                      onChange={(e) => setPart3Count(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg tabular-nums font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Tổng điểm Phần III</label>
                    <input
                      type="number"
                      step="0.25"
                      min={0}
                      max={10}
                      value={part3Points}
                      onChange={(e) => setPart3Points(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg tabular-nums font-bold"
                    />
                  </div>
                </div>
                {part3Count > 0 && (
                  <div className="text-[11px] text-slate-500">
                    Mỗi câu: ~{(part3Points / part3Count).toFixed(3)} điểm (chuẩn GDPT 4 câu = 2.0đ hoặc 4.0đ)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Randomization Options */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">3. Tùy chọn xáo trộn đề</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Xáo trộn thứ tự các câu hỏi trong từng phần</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  Xáo trộn thứ tự 4 phương án A, B, C, D (tự động cập nhật đáp án đúng; giữ nguyên a, b, c, d của câu Đúng/Sai)
                </span>
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <div>
            {!canGenerate && (
              <div className="p-3 mb-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  Ngân hàng hiện không đủ câu hỏi theo số lượng yêu cầu (Phần I thiếu {Math.max(0, part1Count - bankStats.p1Available)}, Phần II thiếu {Math.max(0, part2Count - bankStats.p2Available)}, Phần III thiếu {Math.max(0, part3Count - bankStats.p3Available)}).
                </span>
              </div>
            )}

            <button
              onClick={handleGenerateExam}
              disabled={!canGenerate}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-sm flex items-center justify-center gap-2 transition-all ${
                canGenerate
                  ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              <span>Sinh đề thi ngay ({totalQuestionsNeeded} câu · {totalPoints}đ)</span>
            </button>
          </div>
        </div>

        {/* Right Pane (5 cols): Bank Status & Generated Exams */}
        <div className="lg:col-span-5 space-y-6">
          {/* Real-time Bank Status Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Tình trạng ngân hàng câu hỏi
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Phần I (Trắc nghiệm 4 lựa chọn):</span>
                <span className="font-bold text-indigo-700 tabular-nums">
                  {bankStats.p1Available} khả dụng / cần {part1Count}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (bankStats.p1Available / (part1Count || 1)) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600">Phần II (Đúng / Sai):</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  {bankStats.p2Available} khả dụng / cần {part2Count}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (bankStats.p2Available / (part2Count || 1)) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600">Phần III (Trả lời ngắn):</span>
                <span className="font-bold text-amber-700 tabular-nums">
                  {bankStats.p3Available} khả dụng / cần {part3Count}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (bankStats.p3Available / (part3Count || 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
              Tổng số câu hỏi hợp lệ trong kho: <strong className="text-slate-800">{bankStats.totalVerified}</strong> câu.
            </div>
          </div>

          {/* Saved Exams List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Danh sách đề thi đã tạo ({exams.length})
            </h3>

            {exams.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                Chưa có đề thi nào. Nhấn &quot;Sinh đề thi ngay&quot; để tạo đề đầu tiên.
              </div>
            ) : (
              <div className="space-y-3">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all bg-slate-50/50 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm text-slate-900 leading-snug">
                        {exam.title}
                      </div>
                      <button
                        onClick={() => onDeleteExam(exam.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                        title="Xóa đề này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{exam.questions.length} câu</span>
                      <span aria-hidden="true">·</span>
                      <span>{exam.durationMinutes} phút</span>
                      <span aria-hidden="true">·</span>
                      <span>10.0 điểm</span>
                      {exam.passcode && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-0.5 text-amber-700">
                            <Lock className="w-3 h-3" /> Có mã khóa
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onStartExam(exam)}
                        className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Vào thi trực tuyến</span>
                      </button>

                      <button
                        onClick={() => setViewingExam(exam)}
                        className="py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Xem / In đề</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable / Full Exam Preview Modal */}
      {viewingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-6 p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{viewingExam.title}</h3>
                <div className="text-xs text-slate-500">
                  Thời gian: {viewingExam.durationMinutes} phút · Khối {viewingExam.grade} · GDPT 2018
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In đề kiểm tra</span>
                </button>
                <button
                  onClick={() => onStartExam(viewingExam)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Bắt đầu thi</span>
                </button>
                <button
                  onClick={() => setViewingExam(null)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Print Header */}
            <div className="py-6 border-b border-slate-300 text-center space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                SỞ GIÁO DỤC VÀ ĐÀO TẠO — TRƯỜNG THPT CHUYÊN
              </div>
              <h2 className="text-xl font-bold text-slate-900">{viewingExam.title}</h2>
              <div className="text-xs text-slate-600">
                Môn: {viewingExam.subject} {viewingExam.grade} · Thời gian làm bài: {viewingExam.durationMinutes} phút (không kể thời gian phát đề)
              </div>
              <div className="text-xs italic text-slate-500 pt-2">
                Họ và tên thí sinh: .............................................................. Số báo danh: .........................
              </div>
            </div>

            {/* Questions by Part */}
            <div className="py-6 space-y-8">
              {/* Part I */}
              {viewingExam.questions.some((q) => q.part === 'PART_I') && (
                <div className="space-y-4">
                  <div className="font-bold text-sm text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                    PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn ({viewingExam.partPoints.PART_I} điểm)
                  </div>
                  <div className="text-xs text-slate-500 italic mb-3">
                    Thí sinh trả lời từ câu 1 đến câu {viewingExam.questions.filter((q) => q.part === 'PART_I').length}. Mỗi câu hỏi chỉ chọn một phương án.
                  </div>
                  <div className="space-y-4">
                    {viewingExam.questions
                      .filter((q) => q.part === 'PART_I')
                      .map((q, idx) => (
                        <div key={q.id} className="text-sm space-y-2">
                          <div className="font-medium text-slate-900">
                            <strong>{q.customLevelTag || `[${COGNITIVE_LEVEL_LABELS[q.level].toUpperCase()}]`} Câu {idx + 1}. </strong>
                            <MathView content={q.content} inline />
                          </div>
                          {q.images && q.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 py-1 pl-4">
                              {q.images.map((img, iIdx) => (
                                <img key={iIdx} src={img} alt="Hình vẽ" className="max-h-48 rounded border" />
                              ))}
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                            {q.options?.map((opt) => (
                              <div key={opt.label} className="text-xs text-slate-800 flex items-start gap-1.5">
                                <span className="font-bold">{opt.label}.</span>
                                <div><MathView content={opt.content} inline /></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Part II */}
              {viewingExam.questions.some((q) => q.part === 'PART_II') && (
                <div className="space-y-4 pt-4">
                  <div className="font-bold text-sm text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                    PHẦN II. Câu trắc nghiệm Đúng/Sai ({viewingExam.partPoints.PART_II} điểm)
                  </div>
                  <div className="text-xs text-slate-500 italic mb-3">
                    Thí sinh trả lời từ câu 1 đến câu {viewingExam.questions.filter((q) => q.part === 'PART_II').length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng hoặc Sai.
                  </div>
                  <div className="space-y-4">
                    {viewingExam.questions
                      .filter((q) => q.part === 'PART_II')
                      .map((q, idx) => (
                        <div key={q.id} className="text-sm space-y-2">
                          <div className="font-medium text-slate-900">
                            <strong>{q.customLevelTag || `[${COGNITIVE_LEVEL_LABELS[q.level].toUpperCase()}]`} Câu {idx + 1}. </strong>
                            <MathView content={q.content} inline />
                          </div>
                          {q.images && q.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 py-1 pl-4">
                              {q.images.map((img, iIdx) => (
                                <img key={iIdx} src={img} alt="Hình vẽ" className="max-h-48 rounded border" />
                              ))}
                            </div>
                          )}
                          <div className="space-y-1.5 pl-4">
                            {q.items?.map((it) => (
                              <div key={it.label} className="text-xs text-slate-800 flex items-start gap-2">
                                <span className="font-bold">{it.label})</span>
                                <div><MathView content={it.content} inline /></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Part III */}
              {viewingExam.questions.some((q) => q.part === 'PART_III') && (
                <div className="space-y-4 pt-4">
                  <div className="font-bold text-sm text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                    PHẦN III. Câu trắc nghiệm trả lời ngắn ({viewingExam.partPoints.PART_III} điểm)
                  </div>
                  <div className="text-xs text-slate-500 italic mb-3">
                    Thí sinh trả lời từ câu 1 đến câu {viewingExam.questions.filter((q) => q.part === 'PART_III').length}.
                  </div>
                  <div className="space-y-4">
                    {viewingExam.questions
                      .filter((q) => q.part === 'PART_III')
                      .map((q, idx) => (
                        <div key={q.id} className="text-sm space-y-1">
                          <div className="font-medium text-slate-900">
                            <strong>{q.customLevelTag || `[${COGNITIVE_LEVEL_LABELS[q.level].toUpperCase()}]`} Câu {idx + 1}. </strong>
                            <MathView content={q.content} inline />
                          </div>
                          {q.images && q.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 py-1 pl-4">
                              {q.images.map((img, iIdx) => (
                                <img key={iIdx} src={img} alt="Hình vẽ" className="max-h-48 rounded border" />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamMatrixView;
