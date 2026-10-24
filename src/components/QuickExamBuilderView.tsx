import React, { useState, useRef, useMemo } from 'react';
import { Question, PartType, CognitiveLevel, COGNITIVE_LEVEL_LABELS, Exam, MultipleChoiceOption, TrueFalseItem } from '../types';
import { parseDocxFile, ParseResult } from '../utils/docxParser';
import { SAMPLE_CHEMISTRY_QUESTIONS } from '../utils/sampleExamData';
import { loadCategories, detectCurriculumFromText, SubjectItem } from '../utils/categoryManager';
import MathView from './MathView';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  Zap,
  Play,
  Copy,
  Check,
  Lock,
  Clock,
  Shuffle,
  FileText,
  AlertCircle,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
  Download
} from 'lucide-react';
import { downloadEduChemWordSample } from '../utils/docxSampleGenerator';

interface QuickExamBuilderViewProps {
  onPublishExam: (exam: Exam, snapshotQuestions: Question[]) => void;
  onStartExamDirectly: (exam: Exam) => void;
}

export const QuickExamBuilderView: React.FC<QuickExamBuilderViewProps> = ({
  onPublishExam,
  onStartExamDirectly
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected questions for this exam (by id)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  // Editing single question modal
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Expanded explanations
  const [expandedExpl, setExpandedExpl] = useState<Record<string, boolean>>({});

  // Filter in preview list
  const [activeFilter, setActiveFilter] = useState<'ALL' | PartType | 'WARNINGS'>('ALL');

  // Exam Configuration Settings
  const [examTitle, setExamTitle] = useState('Đề kiểm tra trắc nghiệm online');
  const [examSubject, setExamSubject] = useState('Hóa học');
  const [examGrade, setExamGrade] = useState(11);
  const [examChapter, setExamChapter] = useState('Chương 1: Cân bằng hóa học');
  const [examLesson, setExamLesson] = useState('Khái niệm về cân bằng hóa học');
  const [examDuration, setExamDuration] = useState(50);
  const [examPasscode, setExamPasscode] = useState('');
  const [examMinScore, setExamMinScore] = useState(5.0);

  // Randomization Settings
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  // Part point distributions
  const [p1Points, setP1Points] = useState(4.0);
  const [p2Points, setP2Points] = useState(3.0);
  const [p3Points, setP3Points] = useState(3.0);

  // Share Modal State
  const [publishedExam, setPublishedExam] = useState<Exam | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Categories for autocomplete/dropdown
  const categories: SubjectItem[] = useMemo(() => loadCategories(), []);

  // Process selected file
  const processDocx = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.docx')) {
      alert('Vui lòng chọn tệp Word định dạng .docx');
      return;
    }
    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const res = await parseDocxFile(selectedFile);
      setParseResult(res);

      // Auto select all parsed questions by default
      const allIds = new Set(res.questions.map((q) => q.id));
      setSelectedQuestionIds(allIds);

      // Auto detect title, subject, grade, chapter from text
      const rawSample = `${selectedFile.name} ${res.title} ${res.questions.slice(0, 3).map((q) => q.content).join(' ')}`;
      const detected = detectCurriculumFromText(rawSample, categories);

      const titleClean = res.title || selectedFile.name.replace(/\.[^/.]+$/, '');
      setExamTitle(titleClean);

      if (detected.detectedSubject) setExamSubject(detected.detectedSubject);
      if (detected.detectedGrade) setExamGrade(detected.detectedGrade);
      if (detected.detectedChapter) setExamChapter(detected.detectedChapter);
      if (detected.detectedLesson) setExamLesson(detected.detectedLesson);

      // Calculate initial points based on present parts
      const hasP1 = res.partsFound.part1 > 0;
      const hasP2 = res.partsFound.part2 > 0;
      const hasP3 = res.partsFound.part3 > 0;

      if (hasP1 && hasP2 && hasP3) {
        setP1Points(4.0);
        setP2Points(3.0);
        setP3Points(3.0);
      } else if (hasP1 && !hasP2 && !hasP3) {
        setP1Points(10.0);
        setP2Points(0);
        setP3Points(0);
      } else if (!hasP1 && hasP2 && !hasP3) {
        setP1Points(0);
        setP2Points(10.0);
        setP3Points(0);
      } else if (!hasP1 && !hasP2 && hasP3) {
        setP1Points(0);
        setP2Points(0);
        setP3Points(10.0);
      } else if (hasP1 && hasP2 && !hasP3) {
        setP1Points(6.0);
        setP2Points(4.0);
        setP3Points(0);
      } else if (hasP1 && !hasP2 && hasP3) {
        setP1Points(7.0);
        setP2Points(0);
        setP3Points(3.0);
      }
    } catch (err: any) {
      alert(`Lỗi khi đọc file Word: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Predefined Sample Loader for instant test without uploading
  const loadPredefinedSample = (type: 'FULL_3_PARTS' | 'ONLY_PART_I' | 'ONLY_PART_II' | 'ONLY_PART_III') => {
    setIsProcessing(true);
    setTimeout(() => {
      let filtered: Question[] = [];
      let docTitle = '';

      if (type === 'FULL_3_PARTS') {
        filtered = JSON.parse(JSON.stringify(SAMPLE_CHEMISTRY_QUESTIONS));
        docTitle = 'Chủ đề Cân bằng hóa học (Đầy đủ 3 phần chuẩn GDPT 2018)';
        setP1Points(4.0);
        setP2Points(3.0);
        setP3Points(3.0);
      } else if (type === 'ONLY_PART_I') {
        filtered = JSON.parse(JSON.stringify(SAMPLE_CHEMISTRY_QUESTIONS.filter((q) => q.part === 'PART_I')));
        docTitle = 'Chủ đề Cân bằng hóa học - Phần I (8 câu 4 lựa chọn đủ 4 mức độ)';
        setP1Points(10.0);
        setP2Points(0);
        setP3Points(0);
      } else if (type === 'ONLY_PART_II') {
        filtered = JSON.parse(JSON.stringify(SAMPLE_CHEMISTRY_QUESTIONS.filter((q) => q.part === 'PART_II')));
        docTitle = 'Cân bằng hóa học - Phần II (Trắc nghiệm Đúng/Sai 4 ý a-b-c-d)';
        setP1Points(0);
        setP2Points(10.0);
        setP3Points(0);
      } else if (type === 'ONLY_PART_III') {
        filtered = JSON.parse(JSON.stringify(SAMPLE_CHEMISTRY_QUESTIONS.filter((q) => q.part === 'PART_III')));
        docTitle = 'Cân bằng hóa học - Phần III (Trắc nghiệm trả lời ngắn số)';
        setP1Points(0);
        setP2Points(0);
        setP3Points(10.0);
      }

      setFile(new File(['sample'], `${docTitle}.docx`, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      setExamTitle(docTitle);
      setExamSubject('Hóa học');
      setExamGrade(11);
      setExamChapter('Chương 1: Cân bằng hóa học');
      setExamLesson('Khái niệm về cân bằng hóa học');

      setParseResult({
        title: docTitle,
        subject: 'Hóa học',
        grade: 11,
        durationMinutes: 50,
        chapter: 'Chương 1: Cân bằng hóa học',
        questions: filtered,
        unparsedBlocks: [],
        extractedImages: [],
        partsFound: {
          part1: filtered.filter((q) => q.part === 'PART_I').length,
          part2: filtered.filter((q) => q.part === 'PART_II').length,
          part3: filtered.filter((q) => q.part === 'PART_III').length,
          hasAnswerGrid: true,
          hasExplanations: true
        },
        warnings: []
      });

      setSelectedQuestionIds(new Set(filtered.map((q) => q.id)));
      setIsProcessing(false);
    }, 250);
  };

  // Toggle selection for question
  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!parseResult) return;
    setSelectedQuestionIds(new Set(parseResult.questions.map((q) => q.id)));
  };

  const handleDeselectAll = () => {
    setSelectedQuestionIds(new Set());
  };

  // Delete question from parsed list
  const handleDeleteParsedQuestion = (id: string) => {
    if (!parseResult) return;
    const updated = parseResult.questions.filter((q) => q.id !== id);
    setParseResult({
      ...parseResult,
      questions: updated
    });
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Save edited question
  const handleSaveEditedQuestion = (updated: Question) => {
    if (!parseResult) return;
    const nextQ: Question = {
      ...updated,
      validationWarnings: (updated.validationWarnings || []).filter(
        (w) => !w.includes('Chưa xác định') && !w.includes('Chưa xác nhận')
      )
    };
    if (nextQ.part === 'PART_I' && nextQ.correctOption && nextQ.options && nextQ.options.length === 4) {
      nextQ.isVerified = true;
    } else if (nextQ.part === 'PART_II' && nextQ.items && nextQ.items.length === 4 && nextQ.items.every((it) => it.correctAnswer !== null)) {
      nextQ.isVerified = true;
    } else if (nextQ.part === 'PART_III' && nextQ.shortAnswer) {
      nextQ.isVerified = true;
    }

    const nextQs = parseResult.questions.map((q) => (q.id === nextQ.id ? nextQ : q));
    const p1Count = nextQs.filter((q) => q.part === 'PART_I').length;
    const p2Count = nextQs.filter((q) => q.part === 'PART_II').length;
    const p3Count = nextQs.filter((q) => q.part === 'PART_III').length;

    setParseResult({
      ...parseResult,
      questions: nextQs,
      partsFound: {
        ...parseResult.partsFound,
        part1: p1Count,
        part2: p2Count,
        part3: p3Count
      }
    });
    setEditingQuestion(null);
  };

  // Helper shuffle array
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Publish Quick Online Exam
  const handlePublishOnlineExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parseResult || parseResult.questions.length === 0) return;

    // Filter chosen questions
    const chosen = parseResult.questions.filter((q) => selectedQuestionIds.has(q.id));
    if (chosen.length === 0) {
      alert('Vui lòng chọn ít nhất 1 câu hỏi để tạo đề thi!');
      return;
    }

    // Check total points
    const totalPts = Math.round((p1Points + p2Points + p3Points) * 100) / 100;
    if (Math.abs(totalPts - 10.0) > 0.01) {
      const confirmProceed = confirm(`Tổng điểm cấu hình hiện tại là ${totalPts}đ (thang điểm chuẩn thường là 10.0đ). Thầy/Cô có muốn tiếp tục xuất bản không?`);
      if (!confirmProceed) return;
    }

    // Check unverified questions warning
    const unverifiedCount = chosen.filter((q) => !q.isVerified).length;
    if (unverifiedCount > 0) {
      const ok = confirm(`Có ${unverifiedCount} câu hỏi được đánh dấu là "Chưa xác nhận đáp án". Hệ thống sẽ tạo bài thi nhưng câu đó có thể chưa có đáp án chấm điểm. Thầy/Cô có chắc chắn muốn xuất bản không?`);
      if (!ok) return;
    }

    // Separate by parts for optional shuffling
    let p1 = chosen.filter((q) => q.part === 'PART_I');
    let p2 = chosen.filter((q) => q.part === 'PART_II');
    let p3 = chosen.filter((q) => q.part === 'PART_III');

    if (shuffleQuestions) {
      p1 = shuffleArray(p1);
      p2 = shuffleArray(p2);
      p3 = shuffleArray(p3);
    }

    // Shuffle options for Part I if enabled
    if (shuffleOptions) {
      p1 = p1.map((q) => {
        if (!q.options || q.options.length === 0) return q;
        const origCorrect = q.options.find((o) => o.label === q.correctOption);
        const shuffledContents = shuffleArray(q.options.map((o) => o.content));
        const labels: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
        const newOptions: MultipleChoiceOption[] = shuffledContents.map((content, idx) => ({
          label: labels[idx],
          content
        }));

        let newCorrectLabel = q.correctOption;
        if (origCorrect) {
          const found = newOptions.find((o) => o.content === origCorrect.content);
          if (found) newCorrectLabel = found.label;
        }

        return {
          ...q,
          options: newOptions,
          correctOption: newCorrectLabel
        };
      });
    }

    // Attach exam metadata
    const finalQuestions: Question[] = [...p1, ...p2, ...p3].map((q) => ({
      ...q,
      subject: examSubject,
      grade: examGrade,
      chapter: examChapter,
      lesson: examLesson
    }));

    // Generate 6-digit random PIN code
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();

    const exam: Exam = {
      id: `exam-quick-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: examTitle.trim() || 'Đề kiểm tra trắc nghiệm online',
      subject: examSubject,
      grade: examGrade,
      durationMinutes: examDuration,
      passcode: examPasscode.trim() || undefined,
      pinCode,
      minScoreForExplanation: examMinScore,
      partPoints: {
        PART_I: p1Points,
        PART_II: p2Points,
        PART_III: p3Points
      },
      questions: finalQuestions,
      createdAt: new Date().toISOString()
    };

    onPublishExam(exam, finalQuestions);
    setPublishedExam(exam);
  };

  // Generate shareable link
  const shareableUrl = useMemo(() => {
    if (!publishedExam) return '';
    return `${window.location.origin}${window.location.pathname}?exam=${publishedExam.id}`;
  }, [publishedExam]);

  // Filtered view
  const filteredQuestions = parseResult
    ? parseResult.questions.filter((q) => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'WARNINGS') return q.validationWarnings && q.validationWarnings.length > 0;
        return q.part === activeFilter;
      })
    : [];

  const selectedCount = selectedQuestionIds.size;
  const totalCount = parseResult ? parseResult.questions.length : 0;
  const totalConfiguredPoints = Math.round((p1Points + p2Points + p3Points) * 100) / 100;

  return (
    <div className="space-y-8">
      {/* Introduction Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white p-6 sm:p-8 rounded-2xl shadow-sm border border-indigo-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 fill-emerald-300" />
            <span>Quy trình siêu tốc 1 chạm</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Tạo đề online nhanh từ Word & Lấy Link làm bài ngay
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
            Tải file Word (.docx) → Tự động nhận diện công thức LaTeX & hình ảnh → Kiểm tra/sửa câu hỏi → Thiết lập thời gian & điểm → Nhận ngay <strong>Mã PIN 6 số</strong> và <strong>Link làm bài trực tuyến</strong> cho học sinh.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
          <button
            onClick={() => loadPredefinedSample('FULL_3_PARTS')}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Thử ngay: File mẫu 3 phần Hóa 11</span>
          </button>
        </div>
      </div>

      {/* Upload & Dropzone Area */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Bước 1: Chọn hoặc kéo thả tệp Word (.docx)</span>
          </h3>
          {file && (
            <span className="text-xs text-slate-500 font-mono">
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>

        {/* Download Word Sample Bar */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Tệp Word mẫu chuẩn GDPT 2018</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  .DOCX HỢP LỆ
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                Thầy cô tải file mẫu, thay nội dung câu hỏi và đáp án, sau đó nhập file Word vào EduChem Studio.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={downloadEduChemWordSample}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải file Word mẫu</span>
          </button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              processDocx(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]'
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processDocx(e.target.files[0]);
              }
            }}
          />

          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="font-semibold text-sm text-slate-800">
            {file ? file.name : 'Bấm để chọn file Word hoặc kéo thả vào đây'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hỗ trợ đầy đủ định dạng DOCX: phương trình OMML sang KaTeX, hình ảnh Word Media, bảng đáp án và giải chi tiết
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
            <span>Hoặc thử mẫu đơn:</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); loadPredefinedSample('ONLY_PART_I'); }}
              className="text-indigo-600 hover:underline font-medium"
            >
              Chỉ Phần I (8 câu 4 lựa chọn)
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); loadPredefinedSample('ONLY_PART_II'); }}
              className="text-emerald-600 hover:underline font-medium"
            >
              Chỉ Phần II (Đúng/Sai)
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); loadPredefinedSample('ONLY_PART_III'); }}
              className="text-amber-600 hover:underline font-medium"
            >
              Chỉ Phần III (Trả lời ngắn)
            </button>
          </div>
        </div>
      </div>

      {/* Main Review & Exam Setup Grid */}
      {parseResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Pane (7 cols): Questions Inspection & Modification */}
          <div className="lg:col-span-7 space-y-6">
            {/* Summary Statistics Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Bước 2: Kiểm tra câu hỏi & đáp án ({selectedCount}/{totalCount} câu chọn)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thầy/Cô có thể tích chọn câu hỏi, bấm sửa nội dung hoặc loại bỏ câu không phù hợp.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* Part Counts Breakdown */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                  <div className="font-bold text-indigo-900 text-sm">{parseResult.partsFound.part1} câu</div>
                  <div className="text-[11px] text-indigo-700">Phần I (4 lựa chọn)</div>
                </div>
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <div className="font-bold text-emerald-900 text-sm">{parseResult.partsFound.part2} câu</div>
                  <div className="text-[11px] text-emerald-700">Phần II (Đúng/Sai)</div>
                </div>
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <div className="font-bold text-amber-900 text-sm">{parseResult.partsFound.part3} câu</div>
                  <div className="text-[11px] text-amber-700">Phần III (Trả lời ngắn)</div>
                </div>
              </div>

              {/* Warnings alert if any question lacks answers */}
              {parseResult.questions.some((q) => !q.isVerified) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Cảnh báo:</strong> Có câu hỏi chưa nhận diện được đáp án chính xác trong file Word. Thầy/Cô vui lòng bấm nút &quot;Sửa&quot; trên câu đó để chọn đáp án trước khi học sinh làm bài.
                  </div>
                </div>
              )}

              {/* Filter tabs */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({parseResult.questions.length})
                </button>
                {parseResult.partsFound.part1 > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('PART_I')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeFilter === 'PART_I'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    Phần I ({parseResult.partsFound.part1})
                  </button>
                )}
                {parseResult.partsFound.part2 > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('PART_II')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeFilter === 'PART_II'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Phần II ({parseResult.partsFound.part2})
                  </button>
                )}
                {parseResult.partsFound.part3 > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('PART_III')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeFilter === 'PART_III'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    Phần III ({parseResult.partsFound.part3})
                  </button>
                )}
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => {
                const isSelected = selectedQuestionIds.has(q.id);
                const isExplOpen = !!expandedExpl[q.id];

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-xl border transition-all ${
                      !isSelected
                        ? 'opacity-60 border-slate-200 bg-slate-50/50'
                        : !q.isVerified
                        ? 'border-amber-300 shadow-xs'
                        : 'border-slate-200 hover:border-indigo-300 shadow-xs'
                    }`}
                  >
                    {/* Header Strip with Checkbox, Part, Cognitive Level */}
                    <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectQuestion(q.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-900">
                            Câu {idx + 1}
                          </span>
                        </label>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${
                            q.part === 'PART_I'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : q.part === 'PART_II'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {q.part === 'PART_I'
                              ? 'Dạng 1: Trắc nghiệm 4 lựa chọn (Phần I)'
                              : q.part === 'PART_II'
                              ? 'Dạng 2: Đúng / Sai 4 phát biểu (Phần II)'
                              : 'Dạng 3: Trả lời ngắn (Phần III)'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {q.customLevelTag || `[${COGNITIVE_LEVEL_LABELS[q.level].toUpperCase()}]`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Validation Warnings */}
                        {q.validationWarnings && q.validationWarnings.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {q.validationWarnings.map((warn, wIdx) => {
                              const isAmbiguous = warn.includes('Chưa xác định');
                              return (
                                <span
                                  key={wIdx}
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 border ${
                                    isAmbiguous
                                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                                      : 'bg-amber-50 text-amber-700 border-amber-300'
                                  }`}
                                >
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>{warn}</span>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {!q.isVerified && (!q.validationWarnings || q.validationWarnings.length === 0) && (
                          <span className="text-xs text-amber-700 font-semibold flex items-center gap-1 mr-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Chưa xác nhận đáp án
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditingQuestion(JSON.parse(JSON.stringify(q)))}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa câu hỏi & đáp án"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteParsedQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa câu hỏi này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="text-sm font-medium text-slate-900 leading-relaxed">
                        <MathView content={q.content} />
                      </div>

                      {/* Embedded Diagrams */}
                      {q.images && q.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 py-1">
                          {q.images.map((img, imgIdx) => (
                            <img
                              key={imgIdx}
                              src={img}
                              alt="Hình vẽ câu hỏi"
                              className="max-h-48 rounded-lg border border-slate-200"
                            />
                          ))}
                        </div>
                      )}

                      {/* Part I Options */}
                      {q.part === 'PART_I' && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {q.options.map((opt) => {
                            const isCorrect = q.correctOption === opt.label;
                            return (
                              <div
                                key={opt.label}
                                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                                  isCorrect
                                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                                    : 'bg-slate-50/70 border-slate-200 text-slate-800'
                                }`}
                              >
                                <span
                                  className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-white border border-slate-300 text-slate-600'
                                  }`}
                                >
                                  {opt.label}
                                </span>
                                <div className="flex-1 pt-0.5">
                                  <MathView content={opt.content} />
                                </div>
                                {isCorrect && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Part II True/False Sub-Items */}
                      {q.part === 'PART_II' && q.items && (
                        <div className="space-y-1.5 pt-2">
                          {q.items.map((item) => (
                            <div
                              key={item.label}
                              className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-200 flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="flex items-start gap-2 flex-1">
                                <span className="font-bold text-slate-900 shrink-0 mt-0.5">{item.label})</span>
                                <div className="flex-1 text-slate-800">
                                  <MathView content={item.content} />
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-1">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    item.correctAnswer === 'D'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  Đúng (Đ)
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    item.correctAnswer === 'S'
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  Sai (S)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Part III Short Answer */}
                      {q.part === 'PART_III' && (
                        <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Đáp án số ngắn:</span>
                          <span className="font-mono font-bold text-amber-900 text-sm bg-white px-2.5 py-1 rounded border border-amber-300">
                            {q.shortAnswer || '(Chưa xác định)'}
                          </span>
                        </div>
                      )}

                      {/* Explanation toggle */}
                      {q.explanation && (
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedExpl((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                            }
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                          >
                            {isExplOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            <span>{isExplOpen ? 'Thu gọn lời giải' : 'Xem hướng dẫn giải chi tiết'}</span>
                          </button>
                          {isExplOpen && (
                            <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                              <MathView content={q.explanation} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Pane (5 cols): Exam Settings & Publishing */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            <form onSubmit={handlePublishOnlineExam} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 shadow-xs">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Bước 3: Thiết lập bài thi online</span>
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedCount} câu chọn
                </span>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Tên bài thi kiểm tra</label>
                <input
                  type="text"
                  required
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Subject, Grade, Duration */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học</label>
                  <input
                    type="text"
                    value={examSubject}
                    onChange={(e) => setExamSubject(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp (6-12)</label>
                  <select
                    value={examGrade}
                    onChange={(e) => setExamGrade(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>Lớp {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={examDuration}
                    onChange={(e) => setExamDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 tabular-nums"
                  />
                </div>
              </div>

              {/* Chapter & Lesson (Folder Categorization) */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Chương / Chủ đề</label>
                    <input
                      type="text"
                      value={examChapter}
                      onChange={(e) => setExamChapter(e.target.value)}
                      placeholder="VD: Cân bằng hóa học"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bài học</label>
                    <input
                      type="text"
                      value={examLesson}
                      onChange={(e) => setExamLesson(e.target.value)}
                      placeholder="VD: Khái niệm cân bằng"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Passcode & Min score */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mật khẩu làm bài (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={examPasscode}
                    onChange={(e) => setExamPasscode(e.target.value)}
                    placeholder="Để trống nếu không khóa"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Điểm sàn xem lời giải
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={10}
                    value={examMinScore}
                    onChange={(e) => setExamMinScore(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 tabular-nums"
                  />
                </div>
              </div>

              {/* Shuffling Options */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-700">Tùy chọn xáo trộn đề thi</div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Xáo trộn thứ tự các câu hỏi trong từng phần</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Xáo trộn 4 phương án A, B, C, D (tự động cập nhật đáp án đúng)</span>
                </label>
              </div>

              {/* Part Points Allocation (Scale 10.0) */}
              <div className="space-y-2.5 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-700">Thang điểm từng phần:</div>
                  <div
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      totalConfiguredPoints === 10.0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    Tổng: {totalConfiguredPoints} / 10.0 điểm
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <label className="block text-[11px] text-slate-500 mb-1">Phần I (A-D)</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={10}
                      value={p1Points}
                      onChange={(e) => setP1Points(Number(e.target.value))}
                      className="w-full px-1.5 py-1 text-xs text-center font-bold bg-white border border-slate-200 rounded tabular-nums"
                    />
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <label className="block text-[11px] text-slate-500 mb-1">Phần II (Đ/S)</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={10}
                      value={p2Points}
                      onChange={(e) => setP2Points(Number(e.target.value))}
                      className="w-full px-1.5 py-1 text-xs text-center font-bold bg-white border border-slate-200 rounded tabular-nums"
                    />
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <label className="block text-[11px] text-slate-500 mb-1">Phần III (Số)</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={10}
                      value={p3Points}
                      onChange={(e) => setP3Points(Number(e.target.value))}
                      className="w-full px-1.5 py-1 text-xs text-center font-bold bg-white border border-slate-200 rounded tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={selectedCount === 0}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedCount > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Tạo bài thi online & Lấy Link ({selectedCount} câu)</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Share Published Exam Modal */}
      {publishedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Đã tạo bài thi online thành công!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bài thi đã sẵn sàng cho học sinh truy cập làm bài trực tuyến.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPublishedExam(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Exam Meta Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-slate-900 text-sm">{publishedExam.title}</div>
              <div className="text-slate-500 flex flex-wrap gap-2">
                <span>{publishedExam.questions.length} câu hỏi</span>
                <span>·</span>
                <span>{publishedExam.durationMinutes} phút</span>
                <span>·</span>
                <span>Thang 10 điểm</span>
                {publishedExam.passcode && <span>· Mật khẩu: {publishedExam.passcode}</span>}
              </div>
            </div>

            {/* 6-Digit PIN Code Box */}
            <div className="p-5 bg-gradient-to-br from-indigo-50 to-indigo-100/70 border border-indigo-200 rounded-2xl text-center space-y-1.5">
              <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Mã PIN phòng thi trực tuyến
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-indigo-900 tracking-widest py-1">
                {publishedExam.pinCode}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (publishedExam.pinCode) {
                    navigator.clipboard.writeText(publishedExam.pinCode);
                    setCopiedPin(true);
                    setTimeout(() => setCopiedPin(false), 2000);
                  }
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                {copiedPin ? 'Đã sao chép mã PIN!' : 'Sao chép mã PIN (Học sinh nhập vào phòng thi)'}
              </button>
            </div>

            {/* Direct Share Link Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Link trực tiếp vào bài thi (Gửi cho học sinh):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono truncate"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareableUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Đã chép!' : 'Sao chép link'}</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const toRun = publishedExam;
                  setPublishedExam(null);
                  onStartExamDirectly(toRun);
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Vào phòng thi thử nghiệm ngay (Giao diện học sinh)</span>
              </button>

              <button
                type="button"
                onClick={() => setPublishedExam(null)}
                className="w-full py-2 px-4 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Đóng hộp thoại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Editing Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Chỉnh sửa nội dung & đáp án câu hỏi
              </h3>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Part & Level */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dạng câu hỏi</label>
                <select
                  value={editingQuestion.part}
                  onChange={(e) => {
                    const part = e.target.value as PartType;
                    setEditingQuestion({
                      ...editingQuestion,
                      part,
                      type: part === 'PART_I' ? 'MULTIPLE_CHOICE' : part === 'PART_II' ? 'TRUE_FALSE' : 'SHORT_ANSWER',
                      options: part === 'PART_I' ? (editingQuestion.options && editingQuestion.options.length === 4 ? editingQuestion.options : [
                        { label: 'A', content: editingQuestion.options?.[0]?.content || '' },
                        { label: 'B', content: editingQuestion.options?.[1]?.content || '' },
                        { label: 'C', content: editingQuestion.options?.[2]?.content || '' },
                        { label: 'D', content: editingQuestion.options?.[3]?.content || '' }
                      ]) : undefined,
                      correctOption: part === 'PART_I' ? (editingQuestion.correctOption || 'A') : undefined,
                      items: part === 'PART_II' ? (editingQuestion.items && editingQuestion.items.length === 4 ? editingQuestion.items : [
                        { label: 'a', content: editingQuestion.items?.[0]?.content || '', correctAnswer: 'D' },
                        { label: 'b', content: editingQuestion.items?.[1]?.content || '', correctAnswer: 'S' },
                        { label: 'c', content: editingQuestion.items?.[2]?.content || '', correctAnswer: 'D' },
                        { label: 'd', content: editingQuestion.items?.[3]?.content || '', correctAnswer: 'S' }
                      ]) : undefined,
                      shortAnswer: part === 'PART_III' ? (editingQuestion.shortAnswer || '') : undefined
                    });
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800"
                >
                  <option value="PART_I">Dạng 1: Trắc nghiệm 4 lựa chọn A, B, C, D</option>
                  <option value="PART_II">Dạng 2: Đúng / Sai 4 ý a, b, c, d</option>
                  <option value="PART_III">Dạng 3: Trả lời ngắn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Mức độ nhận thức</label>
                <select
                  value={editingQuestion.level}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, level: e.target.value as CognitiveLevel })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="NHAN_BIET">Nhận biết</option>
                  <option value="THONG_HIEU">Thông hiểu</option>
                  <option value="VAN_DUNG">Vận dụng</option>
                  <option value="VAN_DUNG_CAO">Vận dụng cao</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tag mức độ mở rộng</label>
                <input
                  type="text"
                  value={editingQuestion.customLevelTag || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, customLevelTag: e.target.value })}
                  placeholder="VD: [HIỂU – VẬN DỤNG]"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Đề bài (Hỗ trợ LaTeX $...$)</label>
              <textarea
                rows={3}
                value={editingQuestion.content}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, content: e.target.value })}
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Part I Options Editing */}
            {editingQuestion.part === 'PART_I' && editingQuestion.options && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">4 Phương án & Đáp án đúng</label>
                {editingQuestion.options.map((opt, oIdx) => (
                  <div key={opt.label} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({ ...editingQuestion, correctOption: opt.label, isVerified: true })}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        editingQuestion.correctOption === opt.label
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                    <input
                      type="text"
                      value={opt.content}
                      onChange={(e) => {
                        const nextOpts = [...(editingQuestion.options || [])];
                        nextOpts[oIdx].content = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: nextOpts });
                      }}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Part II True/False Editing */}
            {editingQuestion.part === 'PART_II' && editingQuestion.items && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">4 Lệnh hỏi a), b), c), d) & Đáp án Đúng / Sai</label>
                {editingQuestion.items.map((item, iIdx) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 w-5">{item.label})</span>
                    <input
                      type="text"
                      value={item.content}
                      onChange={(e) => {
                        const nextItems = [...(editingQuestion.items || [])];
                        nextItems[iIdx].content = e.target.value;
                        setEditingQuestion({ ...editingQuestion, items: nextItems });
                      }}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const nextItems = [...(editingQuestion.items || [])];
                          nextItems[iIdx].correctAnswer = 'D';
                          setEditingQuestion({ ...editingQuestion, items: nextItems, isVerified: true });
                        }}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                          item.correctAnswer === 'D' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Đúng
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nextItems = [...(editingQuestion.items || [])];
                          nextItems[iIdx].correctAnswer = 'S';
                          setEditingQuestion({ ...editingQuestion, items: nextItems, isVerified: true });
                        }}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                          item.correctAnswer === 'S' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Sai
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Part III Short Answer Editing */}
            {editingQuestion.part === 'PART_III' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Đáp án số ngắn</label>
                <input
                  type="text"
                  value={editingQuestion.shortAnswer || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, shortAnswer: e.target.value, isVerified: true })}
                  placeholder="VD: 2,5 hoặc 34"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            )}

            {/* Explanation Editing */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Hướng dẫn giải chi tiết</label>
              <textarea
                rows={2}
                value={editingQuestion.explanation || ''}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditedQuestion(editingQuestion)}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickExamBuilderView;
