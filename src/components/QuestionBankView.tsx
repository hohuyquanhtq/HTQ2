import React, { useState, useMemo } from 'react';
import { 
  Question, 
  QuestionType, 
  PartType, 
  CognitiveLevel, 
  COGNITIVE_LEVEL_LABELS, 
  PART_LABELS 
} from '../types';
import MathView from './MathView';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  X,
  FolderTree,
  Tag
} from 'lucide-react';
import { 
  AVAILABLE_SUBJECTS, 
  AVAILABLE_GRADES, 
  CURRICULUM_DATA 
} from '../utils/curriculumData';

interface QuestionBankViewProps {
  questions: Question[];
  onSaveQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onDuplicateQuestion: (q: Question) => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  questions,
  onSaveQuestion,
  onDeleteQuestion,
  onDuplicateQuestion
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<'ALL' | string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<'ALL' | number>('ALL');
  const [selectedChapter, setSelectedChapter] = useState<'ALL' | string>('ALL');
  const [selectedLesson, setSelectedLesson] = useState<'ALL' | string>('ALL');
  const [selectedTopic, setSelectedTopic] = useState<'ALL' | string>('ALL');
  const [selectedPart, setSelectedPart] = useState<'ALL' | PartType>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | CognitiveLevel>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');

  // Modal state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Expanded explanations
  const [expandedExpl, setExpandedExpl] = useState<Record<string, boolean>>({});

  // Dynamic available subjects in questions bank
  const subjects = useMemo(() => {
    const set = new Set<string>(AVAILABLE_SUBJECTS);
    questions.forEach((q) => {
      if (q.subject) set.add(q.subject);
    });
    return Array.from(set);
  }, [questions]);

  // Available chapters based on filter
  const chapters = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (selectedSubject !== 'ALL' && q.subject && q.subject !== selectedSubject) return;
      if (selectedGrade !== 'ALL' && q.grade && q.grade !== selectedGrade) return;
      if (q.chapter) set.add(q.chapter);
    });
    return Array.from(set);
  }, [questions, selectedSubject, selectedGrade]);

  // Available lessons based on filter
  const lessons = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (selectedSubject !== 'ALL' && q.subject && q.subject !== selectedSubject) return;
      if (selectedGrade !== 'ALL' && q.grade && q.grade !== selectedGrade) return;
      if (selectedChapter !== 'ALL' && q.chapter && q.chapter !== selectedChapter) return;
      if (q.lesson) set.add(q.lesson);
    });
    return Array.from(set);
  }, [questions, selectedSubject, selectedGrade, selectedChapter]);

  // Available topics based on filter
  const topics = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (selectedSubject !== 'ALL' && q.subject && q.subject !== selectedSubject) return;
      if (selectedGrade !== 'ALL' && q.grade && q.grade !== selectedGrade) return;
      if (selectedChapter !== 'ALL' && q.chapter && q.chapter !== selectedChapter) return;
      if (selectedLesson !== 'ALL' && q.lesson && q.lesson !== selectedLesson) return;
      if (q.topic) set.add(q.topic);
    });
    return Array.from(set);
  }, [questions, selectedSubject, selectedGrade, selectedChapter, selectedLesson]);

  // Statistics
  const stats = useMemo(() => {
    const total = questions.length;
    const part1 = questions.filter((q) => q.part === 'PART_I').length;
    const part2 = questions.filter((q) => q.part === 'PART_II').length;
    const part3 = questions.filter((q) => q.part === 'PART_III').length;
    const unverified = questions.filter((q) => !q.isVerified || (q.validationWarnings && q.validationWarnings.length > 0)).length;

    const levels = {
      NHAN_BIET: questions.filter((q) => q.level === 'NHAN_BIET').length,
      THONG_HIEU: questions.filter((q) => q.level === 'THONG_HIEU').length,
      VAN_DUNG: questions.filter((q) => q.level === 'VAN_DUNG').length,
      VAN_DUNG_CAO: questions.filter((q) => q.level === 'VAN_DUNG_CAO').length
    };

    return { total, part1, part2, part3, unverified, levels };
  }, [questions]);

  // Filtered list
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedSubject !== 'ALL' && q.subject && q.subject !== selectedSubject) return false;
      if (selectedGrade !== 'ALL' && q.grade && q.grade !== selectedGrade) return false;
      if (selectedChapter !== 'ALL' && q.chapter && q.chapter !== selectedChapter) return false;
      if (selectedLesson !== 'ALL' && q.lesson && q.lesson !== selectedLesson) return false;
      if (selectedTopic !== 'ALL' && q.topic && q.topic !== selectedTopic) return false;
      if (selectedPart !== 'ALL' && q.part !== selectedPart) return false;
      if (selectedLevel !== 'ALL' && q.level !== selectedLevel) return false;
      if (selectedStatus === 'VERIFIED' && !q.isVerified) return false;
      if (selectedStatus === 'UNVERIFIED' && q.isVerified) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const contentMatch = q.content.toLowerCase().includes(term);
        const explMatch = q.explanation?.toLowerCase().includes(term);
        const chapterMatch = q.chapter?.toLowerCase().includes(term);
        const lessonMatch = q.lesson?.toLowerCase().includes(term);
        const topicMatch = q.topic?.toLowerCase().includes(term);
        return contentMatch || explMatch || chapterMatch || lessonMatch || topicMatch;
      }

      return true;
    });
  }, [questions, selectedSubject, selectedGrade, selectedChapter, selectedLesson, selectedTopic, selectedPart, selectedLevel, selectedStatus, searchTerm]);

  // Start creating new question
  const handleAddNew = (part: PartType = 'PART_I') => {
    const newQ: Question = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      subject: selectedSubject !== 'ALL' ? selectedSubject : 'Hóa học',
      grade: selectedGrade !== 'ALL' ? selectedGrade : 11,
      chapter: chapters[0] || 'Cân bằng hóa học',
      lesson: lessons[0] || 'Khái niệm về cân bằng hóa học',
      part,
      type: part === 'PART_I' ? 'MULTIPLE_CHOICE' : part === 'PART_II' ? 'TRUE_FALSE' : 'SHORT_ANSWER',
      level: 'THONG_HIEU',
      content: '',
      options: part === 'PART_I' ? [
        { label: 'A', content: '' },
        { label: 'B', content: '' },
        { label: 'C', content: '' },
        { label: 'D', content: '' }
      ] : undefined,
      correctOption: part === 'PART_I' ? 'A' : undefined,
      items: part === 'PART_II' ? [
        { label: 'a', content: '', correctAnswer: 'D' },
        { label: 'b', content: '', correctAnswer: 'S' },
        { label: 'c', content: '', correctAnswer: 'D' },
        { label: 'd', content: '', correctAnswer: 'S' }
      ] : undefined,
      shortAnswer: part === 'PART_III' ? '' : undefined,
      explanation: '',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingQuestion(newQ);
    setIsModalOpen(true);
  };

  const handleEdit = (q: Question) => {
    setEditingQuestion(JSON.parse(JSON.stringify(q)));
    setIsModalOpen(true);
  };

  const handleModalSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    
    // Auto check verification
    let verified = true;
    const warnings: string[] = [];

    if (!editingQuestion.content.trim()) {
      warnings.push('Nội dung câu hỏi không được để trống');
      verified = false;
    }

    if (editingQuestion.part === 'PART_I') {
      if (!editingQuestion.correctOption) {
        warnings.push('Chưa chọn đáp án đúng');
        verified = false;
      }
      const emptyOpts = (editingQuestion.options || []).filter((o) => !o.content.trim()).length;
      if (emptyOpts > 0) {
        warnings.push(`Có ${emptyOpts} phương án chưa có nội dung`);
        verified = false;
      }
    } else if (editingQuestion.part === 'PART_II') {
      const emptyItems = (editingQuestion.items || []).filter((it) => !it.content.trim() || !it.correctAnswer).length;
      if (emptyItems > 0) {
        warnings.push(`Có ${emptyItems} ý Đúng/Sai chưa hoàn thiện`);
        verified = false;
      }
    } else if (editingQuestion.part === 'PART_III') {
      if (!editingQuestion.shortAnswer?.trim()) {
        warnings.push('Chưa nhập đáp án ngắn');
        verified = false;
      }
    }

    const updated = {
      ...editingQuestion,
      isVerified: verified,
      validationWarnings: warnings,
      updatedAt: new Date().toISOString()
    };

    onSaveQuestion(updated);
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const toggleExplanation = (id: string) => {
    setExpandedExpl((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-medium text-slate-500">Tổng câu hỏi</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-1">Trong ngân hàng</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-medium text-indigo-600">Phần I: Trắc nghiệm</div>
          <div className="text-2xl font-bold text-indigo-700 mt-1 tabular-nums">{stats.part1}</div>
          <div className="text-xs text-slate-400 mt-1">4 phương án A-D</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-medium text-emerald-600">Phần II: Đúng / Sai</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{stats.part2}</div>
          <div className="text-xs text-slate-400 mt-1">4 ý a, b, c, d</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-medium text-amber-600">Phần III: Trả lời ngắn</div>
          <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{stats.part3}</div>
          <div className="text-xs text-slate-400 mt-1">Đáp số ngắn</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-medium text-rose-600">Cần kiểm tra lại</div>
          <div className="text-2xl font-bold text-rose-700 mt-1 tabular-nums">{stats.unverified}</div>
          <div className="text-xs text-slate-400 mt-1">Thiếu đáp án/cảnh báo</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-medium text-slate-600">Phân bố mức độ</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold tabular-nums">
            <span className="text-sky-600" title="Nhận biết">{stats.levels.NHAN_BIET}B</span>
            <span className="text-slate-300">/</span>
            <span className="text-emerald-600" title="Thông hiểu">{stats.levels.THONG_HIEU}H</span>
            <span className="text-slate-300">/</span>
            <span className="text-amber-600" title="Vận dụng">{stats.levels.VAN_DUNG}VD</span>
            <span className="text-slate-300">/</span>
            <span className="text-rose-600" title="Vận dụng cao">{stats.levels.VAN_DUNG_CAO}VDC</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">NB / TH / VD / VDC</div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Add Button */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo nội dung câu hỏi, chương, lời giải hoặc công thức..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Filters in exact requested order */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Môn học */}
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedChapter('ALL');
              setSelectedLesson('ALL');
              setSelectedTopic('ALL');
            }}
            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">1. Mọi môn học</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* 2. Khối lớp (Lớp 6 đến Lớp 12) */}
          <select
            value={selectedGrade}
            onChange={(e) => {
              const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
              setSelectedGrade(val as any);
              setSelectedChapter('ALL');
              setSelectedLesson('ALL');
              setSelectedTopic('ALL');
            }}
            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">2. Mọi khối lớp (6-12)</option>
            {AVAILABLE_GRADES.map((g) => (
              <option key={g} value={g}>Lớp {g}</option>
            ))}
          </select>

          {/* 3. Chương / Chủ đề lớn */}
          {chapters.length > 0 && (
            <select
              value={selectedChapter}
              onChange={(e) => {
                setSelectedChapter(e.target.value);
                setSelectedLesson('ALL');
                setSelectedTopic('ALL');
              }}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 max-w-[140px] truncate focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">3. Mọi chương</option>
              {chapters.map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          )}

          {/* 4. Bài học */}
          {lessons.length > 0 && (
            <select
              value={selectedLesson}
              onChange={(e) => {
                setSelectedLesson(e.target.value);
                setSelectedTopic('ALL');
              }}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 max-w-[140px] truncate focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">4. Mọi bài học</option>
              {lessons.map((ls) => (
                <option key={ls} value={ls}>{ls}</option>
              ))}
            </select>
          )}

          {/* 5. Chủ đề */}
          {topics.length > 0 && (
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 max-w-[130px] truncate focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">5. Mọi chủ đề</option>
              {topics.map((tp) => (
                <option key={tp} value={tp}>{tp}</option>
              ))}
            </select>
          )}

          {/* 6. Loại câu hỏi (Phần thi) */}
          <select
            value={selectedPart}
            onChange={(e) => setSelectedPart(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">6. Mọi phần thi</option>
            <option value="PART_I">Phần I (4 lựa chọn)</option>
            <option value="PART_II">Phần II (Đúng/Sai)</option>
            <option value="PART_III">Phần III (Trả lời ngắn)</option>
          </select>

          {/* 7. Mức độ nhận thức */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">7. Mọi mức độ</option>
            <option value="NHAN_BIET">Nhận biết</option>
            <option value="THONG_HIEU">Thông hiểu</option>
            <option value="VAN_DUNG">Vận dụng</option>
            <option value="VAN_DUNG_CAO">Vận dụng cao</option>
          </select>

          {/* 8. Trạng thái xác nhận */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="VERIFIED">Đã xác nhận</option>
            <option value="UNVERIFIED">Cần xem xét</option>
          </select>

          {/* Verification Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="VERIFIED">Đã xác nhận</option>
            <option value="UNVERIFIED">Cần xem xét</option>
          </select>

          {/* Add Question Button */}
          <button
            onClick={() => handleAddNew('PART_I')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm câu hỏi</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">Không tìm thấy câu hỏi phù hợp</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Thử thay đổi bộ lọc hoặc thêm câu hỏi mới vào ngân hàng.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isExplOpen = !!expandedExpl[q.id];

            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl border transition-all ${
                  !q.isVerified
                    ? 'border-amber-300 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Question Header Strip */}
                <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900 tabular-nums">
                      Câu {idx + 1}
                    </span>

                    {/* Folder Path & Cognitive Level Metadata */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">
                        {q.subject || 'Hóa học'} · Lớp {q.grade || 11}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-indigo-700">
                        {q.part === 'PART_I' ? 'Phần I' : q.part === 'PART_II' ? 'Phần II' : 'Phần III'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {q.customLevelTag || `[${COGNITIVE_LEVEL_LABELS[q.level].toUpperCase()}]`}
                      </span>
                      {q.chapter && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-700 font-medium" title="Chương">{q.chapter}</span>
                        </>
                      )}
                      {q.lesson && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-500 italic" title="Bài học">{q.lesson}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {!q.isVerified && (
                      <span className="text-xs text-amber-700 font-medium flex items-center gap-1 mr-2">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Chưa duyệt đáp án
                      </span>
                    )}

                    <button
                      onClick={() => handleEdit(q)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Chỉnh sửa câu hỏi"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDuplicateQuestion(q)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                      title="Nhân bản câu hỏi"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(q.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Body */}
                <div className="p-5 space-y-4">
                  {/* Warning banner if any */}
                  {q.validationWarnings && q.validationWarnings.length > 0 && (
                    <div className="p-2.5 bg-amber-50 rounded-lg text-xs text-amber-800 space-y-1">
                      {q.validationWarnings.map((w, wIdx) => (
                        <div key={wIdx} className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Prompt Text with Math/Chem Rendering */}
                  <div className="text-sm font-medium text-slate-900 leading-relaxed">
                    <MathView content={q.content} />
                  </div>

                  {/* Embedded Images / Drawings */}
                  {q.images && q.images.length > 0 && (
                    <div className="flex flex-wrap gap-3 py-2">
                      {q.images.map((imgSrc, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={imgSrc}
                          alt={`Hình vẽ minh họa câu hỏi`}
                          className="max-h-56 max-w-full rounded-lg border border-slate-200 object-contain bg-white shadow-xs"
                        />
                      ))}
                    </div>
                  )}

                  {/* Part I Options */}
                  {q.part === 'PART_I' && q.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                      {q.options.map((opt) => {
                        const isCorrect = q.correctOption?.toUpperCase() === opt.label.toUpperCase();
                        return (
                          <div
                            key={opt.label}
                            className={`p-3 rounded-lg border text-sm flex items-start gap-3 transition-colors ${
                              isCorrect
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                                : 'bg-slate-50/60 border-slate-200 text-slate-800'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
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
                    <div className="space-y-2 pt-1">
                      {q.items.map((item) => {
                        const isTrue = item.correctAnswer === 'D';
                        const isFalse = item.correctAnswer === 'S';

                        return (
                          <div
                            key={item.label}
                            className="p-3 bg-slate-50/70 rounded-lg border border-slate-200 flex items-start justify-between gap-4 text-sm"
                          >
                            <div className="flex items-start gap-2.5 flex-1">
                              <span className="font-bold text-slate-900 text-xs shrink-0 mt-0.5">
                                {item.label})
                              </span>
                              <div className="flex-1 text-slate-800">
                                <MathView content={item.content} />
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  isTrue
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                Đúng (Đ)
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  isFalse
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                Sai (S)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Part III Short Answer */}
                  {q.part === 'PART_III' && (
                    <div className="p-3.5 bg-amber-50/60 rounded-lg border border-amber-200 flex items-center justify-between text-sm">
                      <span className="text-slate-600 text-xs font-medium">
                        Đáp án số / ký tự ngắn:
                      </span>
                      <span className="font-mono font-bold text-amber-900 text-base bg-white px-3 py-1 rounded border border-amber-300">
                        {q.shortAnswer || '(Chưa xác định)'}
                      </span>
                    </div>
                  )}

                  {/* Explanation Toggle */}
                  {q.explanation && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => toggleExplanation(q.id)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                      >
                        {isExplOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{isExplOpen ? 'Thu gọn lời giải' : 'Xem hướng dẫn giải chi tiết'}</span>
                      </button>

                      {isExplOpen && (
                        <div className="mt-2.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                          <div className="font-semibold text-slate-900 mb-1">Hướng dẫn giải:</div>
                          <MathView content={q.explanation} />
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Xác nhận xóa câu hỏi?</h3>
            <p className="text-sm text-slate-600">
              Câu hỏi này sẽ bị xóa vĩnh viễn khỏi ngân hàng câu hỏi cục bộ. Thao tác không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onDeleteQuestion(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {isModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingQuestion.content ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSave} className="space-y-4 pt-4">
              {/* Row 1: Subject, Grade, Part */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Môn học</label>
                  <select
                    value={editingQuestion.subject || 'Hóa học'}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, subject: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {AVAILABLE_SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Khối lớp (6 - 12)</label>
                  <select
                    value={editingQuestion.grade || 11}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, grade: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {AVAILABLE_GRADES.map((g) => (
                      <option key={g} value={g}>Lớp {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cấu trúc phần thi</label>
                  <select
                    value={editingQuestion.part}
                    onChange={(e) => {
                      const part = e.target.value as PartType;
                      setEditingQuestion({
                        ...editingQuestion,
                        part,
                        type: part === 'PART_I' ? 'MULTIPLE_CHOICE' : part === 'PART_II' ? 'TRUE_FALSE' : 'SHORT_ANSWER',
                        options: part === 'PART_I' ? (editingQuestion.options || [
                          { label: 'A', content: '' },
                          { label: 'B', content: '' },
                          { label: 'C', content: '' },
                          { label: 'D', content: '' }
                        ]) : undefined,
                        correctOption: part === 'PART_I' ? (editingQuestion.correctOption || 'A') : undefined,
                        items: part === 'PART_II' ? (editingQuestion.items || [
                          { label: 'a', content: '', correctAnswer: 'D' },
                          { label: 'b', content: '', correctAnswer: 'S' },
                          { label: 'c', content: '', correctAnswer: 'D' },
                          { label: 'd', content: '', correctAnswer: 'S' }
                        ]) : undefined,
                        shortAnswer: part === 'PART_III' ? (editingQuestion.shortAnswer || '') : undefined
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="PART_I">Phần I (4 lựa chọn A-D)</option>
                    <option value="PART_II">Phần II (Đúng / Sai a-d)</option>
                    <option value="PART_III">Phần III (Trả lời ngắn)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Level, Custom Tag, Chapter, Lesson */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mức độ nhận thức</label>
                  <select
                    value={editingQuestion.level}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, level: e.target.value as CognitiveLevel })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    placeholder="VD: [HIỂU – VẬN DỤNG]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Chương / Chuyên đề</label>
                  <input
                    type="text"
                    value={editingQuestion.chapter}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, chapter: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    placeholder="VD: Cân bằng hóa học"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Bài học cụ thể</label>
                  <input
                    type="text"
                    value={editingQuestion.lesson || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, lesson: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    placeholder="VD: Khái niệm cân bằng"
                  />
                </div>
              </div>

              {/* Question Content */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nội dung câu hỏi (hỗ trợ công thức LaTeX $...$ và ký hiệu hóa học)
                </label>
                <textarea
                  rows={3}
                  value={editingQuestion.content}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, content: e.target.value })}
                  placeholder="Nhập đề bài câu hỏi..."
                  className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
                {editingQuestion.content && (
                  <div className="mt-1 p-2 bg-slate-100 rounded text-xs text-slate-600">
                    <span className="font-medium text-slate-500">Xem trước: </span>
                    <MathView content={editingQuestion.content} inline />
                  </div>
                )}
              </div>

              {/* Part I Options */}
              {editingQuestion.part === 'PART_I' && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold text-slate-700">4 Phương án & Đáp án đúng:</div>
                  {(editingQuestion.options || []).map((opt, oIdx) => (
                    <div key={opt.label} className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                        <input
                          type="radio"
                          name="correctOptionRadio"
                          checked={editingQuestion.correctOption === opt.label}
                          onChange={() => setEditingQuestion({ ...editingQuestion, correctOption: opt.label })}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-700">{opt.label}.</span>
                      </label>
                      <input
                        type="text"
                        value={opt.content}
                        onChange={(e) => {
                          const newOpts = [...(editingQuestion.options || [])];
                          newOpts[oIdx] = { ...opt, content: e.target.value };
                          setEditingQuestion({ ...editingQuestion, options: newOpts });
                        }}
                        placeholder={`Nội dung phương án ${opt.label}...`}
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Part II Items */}
              {editingQuestion.part === 'PART_II' && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold text-slate-700">4 Ý Đúng / Sai (a, b, c, d):</div>
                  {(editingQuestion.items || []).map((item, iIdx) => (
                    <div key={item.label} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-800">{item.label})</span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input
                              type="radio"
                              name={`sub_${item.label}`}
                              checked={item.correctAnswer === 'D'}
                              onChange={() => {
                                const newItems = [...(editingQuestion.items || [])];
                                newItems[iIdx] = { ...item, correctAnswer: 'D' };
                                setEditingQuestion({ ...editingQuestion, items: newItems });
                              }}
                            />
                            <span className="font-semibold text-emerald-700">Đúng (Đ)</span>
                          </label>
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input
                              type="radio"
                              name={`sub_${item.label}`}
                              checked={item.correctAnswer === 'S'}
                              onChange={() => {
                                const newItems = [...(editingQuestion.items || [])];
                                newItems[iIdx] = { ...item, correctAnswer: 'S' };
                                setEditingQuestion({ ...editingQuestion, items: newItems });
                              }}
                            />
                            <span className="font-semibold text-rose-700">Sai (S)</span>
                          </label>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={item.content}
                        onChange={(e) => {
                          const newItems = [...(editingQuestion.items || [])];
                          newItems[iIdx] = { ...item, content: e.target.value };
                          setEditingQuestion({ ...editingQuestion, items: newItems });
                        }}
                        placeholder={`Nội dung ý ${item.label}...`}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Part III Short Answer */}
              {editingQuestion.part === 'PART_III' && (
                <div className="pt-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Đáp án đúng (chuỗi ngắn hoặc số thập phân, tối đa 4 ký tự)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={editingQuestion.shortAnswer || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, shortAnswer: e.target.value })}
                    placeholder="VD: 2,5 hoặc 12 hoặc 4"
                    className="w-48 px-3 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Hướng dẫn giải chi tiết (tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  placeholder="Giải thích các bước giải, phương trình hóa học, bảo toàn electron..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Lưu câu hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankView;
