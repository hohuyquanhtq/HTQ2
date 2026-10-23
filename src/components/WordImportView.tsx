import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Question, PartType, CognitiveLevel, COGNITIVE_LEVEL_LABELS, Exam } from '../types';
import { parseDocxFile, ParseResult } from '../utils/docxParser';
import { SAMPLE_CHEMISTRY_QUESTIONS } from '../utils/sampleExamData';
import { 
  loadCategories, 
  saveCategories, 
  addChapterToCategory, 
  addLessonToChapter, 
  addTopicToLesson, 
  detectCurriculumFromText,
  SubjectItem,
  ChapterItem,
  LessonItem,
  normalizeCategoryName
} from '../utils/categoryManager';
import MathView from './MathView';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Info,
  RefreshCw,
  FileText,
  FolderTree,
  Zap,
  Share2,
  Copy,
  ExternalLink,
  Play,
  Lock,
  Clock,
  BookOpen,
  Check,
  Plus,
  Layers,
  Sparkles,
  Tag,
  ChevronDown,
  ChevronUp,
  X,
  Edit3
} from 'lucide-react';

interface WordImportViewProps {
  onCommitQuestions: (newQuestions: Question[], mode: 'MERGE' | 'REPLACE') => void;
  onCreateQuickExam?: (exam: Exam, questionsToCommit: Question[]) => void;
  onStartExamDirectly?: (exam: Exam) => void;
}

export const WordImportView: React.FC<WordImportViewProps> = ({ 
  onCommitQuestions,
  onCreateQuickExam,
  onStartExamDirectly
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | PartType | 'WARNINGS'>('ALL');
  const [commitMode, setCommitMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Learning Categories from Storage
  const [categories, setCategories] = useState<SubjectItem[]>(() => loadCategories());

  // Reload categories on mount or update
  const refreshCategories = () => {
    setCategories(loadCategories());
  };

  // Two Classification Modes:
  // Mode A: FILE_WIDE (all questions in file receive the same category)
  // Mode B: PER_QUESTION (each question can be individually assigned to chapter/lesson/topic)
  const [classificationMode, setClassificationMode] = useState<'FILE_WIDE' | 'PER_QUESTION'>('FILE_WIDE');

  // File-wide folder selections
  const [targetSubject, setTargetSubject] = useState<string>('Hóa học');
  const [targetGrade, setTargetGrade] = useState<number>(11);
  const [targetChapter, setTargetChapter] = useState<string>('Chương 1: Cân bằng hóa học');
  const [targetLesson, setTargetLesson] = useState<string>('Khái niệm về cân bằng hóa học');
  const [targetTopic, setTargetTopic] = useState<string>('Trọng tâm bài học');

  // Per-question category overrides in Mode B: { [qId]: { chapter, lesson, topic } }
  const [perQuestionMeta, setPerQuestionMeta] = useState<Record<string, { chapter: string; lesson?: string; topic?: string }>>({});

  // Detected suggestions from Word file
  const [detectedSuggestion, setDetectedSuggestion] = useState<{
    subject?: string;
    grade?: number;
    chapter?: string;
    lesson?: string;
    isNewChapter?: boolean;
    isNewLesson?: boolean;
  } | null>(null);

  // Quick Inline Add Modal States (never leaving the import screen!)
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [newChapterInput, setNewChapterInput] = useState('');

  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  const [newLessonInput, setNewLessonInput] = useState('');

  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState('');

  // Quick Exam Creation State
  const [isQuickExamModalOpen, setIsQuickExamModalOpen] = useState(false);
  const [quickExamTitle, setQuickExamTitle] = useState('');
  const [quickExamDuration, setQuickExamDuration] = useState(50);
  const [quickExamPasscode, setQuickExamPasscode] = useState('');
  const [quickExamMinScore, setQuickExamMinScore] = useState(5.0);
  const [quickExamP1Pts, setQuickExamP1Pts] = useState(4.0);
  const [quickExamP2Pts, setQuickExamP2Pts] = useState(3.0);
  const [quickExamP3Pts, setQuickExamP3Pts] = useState(3.0);

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [createdExam, setCreatedExam] = useState<Exam | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Expanded explanations
  const [expandedExpl, setExpandedExpl] = useState<Record<string, boolean>>({});

  // Computed available chapters based on current subject & grade
  const availableChapters = useMemo(() => {
    const subj = categories.find((s) => normalizeCategoryName(s.name) === normalizeCategoryName(targetSubject));
    const gr = subj?.grades.find((g) => g.gradeNumber === targetGrade);
    return gr ? gr.chapters : [];
  }, [categories, targetSubject, targetGrade]);

  // Computed available lessons based on current chapter
  const availableLessons = useMemo(() => {
    const ch = availableChapters.find(
      (c) => normalizeCategoryName(c.name) === normalizeCategoryName(targetChapter)
    );
    return ch ? ch.lessons : [];
  }, [availableChapters, targetChapter]);

  // Computed available topics based on current lesson
  const availableTopics = useMemo(() => {
    const ls = availableLessons.find(
      (l) => normalizeCategoryName(l.name) === normalizeCategoryName(targetLesson)
    );
    return ls?.topics || [];
  }, [availableLessons, targetLesson]);

  // Ensure targetChapter & targetLesson always have valid values when subject/grade changes
  useEffect(() => {
    if (availableChapters.length > 0) {
      const match = availableChapters.find((c) => normalizeCategoryName(c.name) === normalizeCategoryName(targetChapter));
      if (!match) {
        setTargetChapter(availableChapters[0].name);
      }
    }
  }, [availableChapters, targetChapter]);

  useEffect(() => {
    if (availableLessons.length > 0) {
      const match = availableLessons.find((l) => normalizeCategoryName(l.name) === normalizeCategoryName(targetLesson));
      if (!match) {
        setTargetLesson(availableLessons[0].name);
      }
    }
  }, [availableLessons, targetLesson]);

  // Handle file upload
  const handleFileUpload = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.docx')) {
      alert('Vui lòng chọn tệp định dạng Microsoft Word (.docx)');
      return;
    }
    setFile(selectedFile);
    setIsProcessing(true);
    setSuccessNotice(null);

    try {
      const res = await parseDocxFile(selectedFile);
      setParseResult(res);

      // Auto detect curriculum info from text & doc name
      const fullSample = `${selectedFile.name} ${res.title} ${res.questions.map((q) => q.content).join(' ')}`;
      const detected = detectCurriculumFromText(fullSample, categories);

      let foundSubj = targetSubject;
      let foundGrade = targetGrade;

      if (detected.detectedSubject) {
        foundSubj = detected.detectedSubject;
        setTargetSubject(foundSubj);
      }
      if (detected.detectedGrade) {
        foundGrade = detected.detectedGrade;
        setTargetGrade(foundGrade);
      }

      setQuickExamTitle(res.title || selectedFile.name.replace(/\.[^/.]+$/, ''));

      // Check if detected chapter already exists in category tree
      const subjObj = categories.find((s) => normalizeCategoryName(s.name) === normalizeCategoryName(foundSubj));
      const gradeObj = subjObj?.grades.find((g) => g.gradeNumber === foundGrade);

      let isNewChapter = false;
      let isNewLesson = false;

      if (detected.detectedChapter) {
        const existingCh = gradeObj?.chapters.find(
          (c) => normalizeCategoryName(c.name) === normalizeCategoryName(detected.detectedChapter!)
        );
        if (existingCh) {
          setTargetChapter(existingCh.name);
          if (detected.detectedLesson) {
            const existingLs = existingCh.lessons.find(
              (l) => normalizeCategoryName(l.name) === normalizeCategoryName(detected.detectedLesson!)
            );
            if (existingLs) {
              setTargetLesson(existingLs.name);
            } else {
              isNewLesson = true;
            }
          }
        } else {
          isNewChapter = true;
        }

        setDetectedSuggestion({
          subject: foundSubj,
          grade: foundGrade,
          chapter: detected.detectedChapter,
          lesson: detected.detectedLesson,
          isNewChapter,
          isNewLesson
        });
      }

      // Check if file contains questions from multiple chapters (suggest Mode B)
      const chaptersInText = new Set<string>();
      res.questions.forEach((q) => {
        const match = q.content.match(/(?:Chương|Chuyên đề)\s*([0-9IVXLCDM]+[:\.\-][^\n\r]+)/i);
        if (match && match[1]) chaptersInText.add(match[1].trim());
      });

      if (chaptersInText.size > 1) {
        setClassificationMode('PER_QUESTION');
      } else {
        setClassificationMode('FILE_WIDE');
      }
    } catch (err: any) {
      alert(`Lỗi khi đọc file DOCX: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Load predefined sample test files
  const loadPredefinedSample = (type: 'FULL_3_PARTS' | 'ONLY_PART_I' | 'ONLY_PART_II' | 'ONLY_PART_III') => {
    setIsProcessing(true);
    setSuccessNotice(null);

    setTimeout(() => {
      let filtered: Question[] = [];
      let docTitle = '';

      if (type === 'FULL_3_PARTS') {
        filtered = JSON.parse(JSON.stringify(SAMPLE_CHEMISTRY_QUESTIONS));
        docTitle = 'Chủ đề Cân bằng hóa học (Đầy đủ 3 phần chuẩn GDPT 2018)';
      } else if (type === 'ONLY_PART_I') {
        filtered = JSON.parse(JSON.stringify(SAMPLE_CHEMISTRY_QUESTIONS.filter((q) => q.part === 'PART_I')));
        docTitle = 'Chủ đề Cân bằng hóa học - Phần I (8 câu 4 lựa chọn đủ 4 mức độ)';
      } else if (type === 'ONLY_PART_II') {
        filtered = JSON.parse(JSON.stringify(SAMPLE_CHEMISTRY_QUESTIONS.filter((q) => q.part === 'PART_II')));
        docTitle = 'Cân bằng hóa học - Phần II (Trắc nghiệm Đúng/Sai 4 ý a-b-c-d)';
      } else if (type === 'ONLY_PART_III') {
        filtered = JSON.parse(JSON.stringify(SAMPLE_CHEMISTRY_QUESTIONS.filter((q) => q.part === 'PART_III')));
        docTitle = 'Cân bằng hóa học - Phần III (Trắc nghiệm trả lời ngắn số)';
      }

      setFile(new File(['sample'], `${docTitle}.docx`, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      setTargetSubject('Hóa học');
      setTargetGrade(11);
      setTargetChapter('Chương 1: Cân bằng hóa học');
      setTargetLesson('Khái niệm về cân bằng hóa học');
      setQuickExamTitle(docTitle);

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
      setIsProcessing(false);
    }, 250);
  };

  // Add New Subject handler
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectInput.trim()) return;
    const name = newSubjectInput.trim();
    const updated = JSON.parse(JSON.stringify(categories)) as SubjectItem[];
    if (!updated.some((s) => normalizeCategoryName(s.name) === normalizeCategoryName(name))) {
      const newSubj: SubjectItem = {
        id: `subj-${Date.now()}`,
        name,
        grades: [6, 7, 8, 9, 10, 11, 12].map((g) => ({
          id: `gr-${Date.now()}-${g}`,
          gradeNumber: g,
          chapters: []
        }))
      };
      updated.push(newSubj);
      saveCategories(updated);
      setCategories(updated);
    }
    setTargetSubject(name);
    setNewSubjectInput('');
    setIsAddSubjectModalOpen(false);
  };

  // Add New Chapter handler
  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterInput.trim()) return;
    const { updatedCategories, newChapter } = addChapterToCategory(
      categories,
      targetSubject,
      targetGrade,
      newChapterInput.trim()
    );
    setCategories(updatedCategories);
    setTargetChapter(newChapter.name);
    if (newChapter.lessons.length > 0) {
      setTargetLesson(newChapter.lessons[0].name);
    }
    setNewChapterInput('');
    setIsAddChapterModalOpen(false);
  };

  // Add New Lesson handler
  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonInput.trim()) return;
    const { updatedCategories, newLesson } = addLessonToChapter(
      categories,
      targetSubject,
      targetGrade,
      targetChapter,
      newLessonInput.trim()
    );
    setCategories(updatedCategories);
    setTargetLesson(newLesson.name);
    setNewLessonInput('');
    setIsAddLessonModalOpen(false);
  };

  // Accept detected suggestion and automatically create category if needed
  const handleAcceptSuggestion = () => {
    if (!detectedSuggestion) return;
    let currentCats = categories;

    if (detectedSuggestion.chapter) {
      if (detectedSuggestion.isNewChapter) {
        const res = addChapterToCategory(
          currentCats,
          targetSubject,
          targetGrade,
          detectedSuggestion.chapter
        );
        currentCats = res.updatedCategories;
        setCategories(currentCats);
      }
      setTargetChapter(detectedSuggestion.chapter);

      if (detectedSuggestion.lesson) {
        if (detectedSuggestion.isNewLesson) {
          const res = addLessonToChapter(
            currentCats,
            targetSubject,
            targetGrade,
            detectedSuggestion.chapter,
            detectedSuggestion.lesson
          );
          currentCats = res.updatedCategories;
          setCategories(currentCats);
        }
        setTargetLesson(detectedSuggestion.lesson);
      }
    }

    setDetectedSuggestion(null);
  };

  // Apply folder selection to all questions in preview
  const handleApplyFolderToAll = () => {
    if (!parseResult) return;
    const updated = parseResult.questions.map((q) => ({
      ...q,
      subject: targetSubject,
      grade: targetGrade,
      chapter: targetChapter,
      lesson: targetLesson,
      topic: targetTopic
    }));
    setParseResult({
      ...parseResult,
      questions: updated
    });
    setSuccessNotice(`Đã gán phân loại: "${targetSubject} · Lớp ${targetGrade} · ${targetChapter} · ${targetLesson}" cho tất cả ${updated.length} câu hỏi.`);
  };

  // Commit Questions into Question Bank
  const handleCommitToBank = () => {
    if (!parseResult || parseResult.questions.length === 0) return;

    // Find category IDs for stable references
    const subjObj = categories.find((s) => normalizeCategoryName(s.name) === normalizeCategoryName(targetSubject));
    const gradeObj = subjObj?.grades.find((g) => g.gradeNumber === targetGrade);
    const chapterObj = gradeObj?.chapters.find((c) => normalizeCategoryName(c.name) === normalizeCategoryName(targetChapter));
    const lessonObj = chapterObj?.lessons.find((l) => normalizeCategoryName(l.name) === normalizeCategoryName(targetLesson));

    const finalQuestions: Question[] = parseResult.questions.map((q) => {
      // In Mode B: use per-question override if specified
      if (classificationMode === 'PER_QUESTION' && perQuestionMeta[q.id]) {
        const override = perQuestionMeta[q.id];
        return {
          ...q,
          subject: targetSubject,
          grade: targetGrade,
          chapter: override.chapter || targetChapter,
          lesson: override.lesson || targetLesson,
          topic: override.topic || targetTopic,
          subjectId: subjObj?.id,
          gradeId: gradeObj?.id,
          sourceDoc: file?.name || 'File Word nhập'
        };
      }

      // In Mode A: use file-wide folder
      return {
        ...q,
        subject: targetSubject,
        grade: targetGrade,
        chapter: targetChapter,
        lesson: targetLesson,
        topic: targetTopic,
        subjectId: subjObj?.id,
        gradeId: gradeObj?.id,
        chapterId: chapterObj?.id,
        lessonId: lessonObj?.id,
        sourceDoc: file?.name || 'File Word nhập'
      };
    });

    onCommitQuestions(finalQuestions, commitMode);
  };

  // Open Quick Exam Modal from WordImport
  const handleOpenQuickExamModal = () => {
    if (!parseResult || parseResult.questions.length === 0) return;
    const hasP1 = parseResult.partsFound.part1 > 0;
    const hasP2 = parseResult.partsFound.part2 > 0;
    const hasP3 = parseResult.partsFound.part3 > 0;

    if (hasP1 && hasP2 && hasP3) {
      setQuickExamP1Pts(4.0);
      setQuickExamP2Pts(3.0);
      setQuickExamP3Pts(3.0);
    } else if (hasP1 && !hasP2 && !hasP3) {
      setQuickExamP1Pts(10.0);
      setQuickExamP2Pts(0);
      setQuickExamP3Pts(0);
    } else if (!hasP1 && hasP2 && !hasP3) {
      setQuickExamP1Pts(0);
      setQuickExamP2Pts(10.0);
      setQuickExamP3Pts(0);
    } else if (!hasP1 && !hasP2 && hasP3) {
      setQuickExamP1Pts(0);
      setQuickExamP2Pts(0);
      setQuickExamP3Pts(10.0);
    }

    setIsQuickExamModalOpen(true);
  };

  // Submit Quick Exam Creation & Open Share Link
  const handlePublishQuickExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parseResult || parseResult.questions.length === 0) return;

    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();

    const questionsWithMeta = parseResult.questions.map((q) => ({
      ...q,
      subject: targetSubject,
      grade: targetGrade,
      chapter: targetChapter,
      lesson: targetLesson
    }));

    const exam: Exam = {
      id: `exam-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: quickExamTitle.trim() || parseResult.title || 'Đề kiểm tra trực tuyến',
      subject: targetSubject,
      grade: targetGrade,
      durationMinutes: quickExamDuration,
      passcode: quickExamPasscode.trim() || undefined,
      pinCode,
      minScoreForExplanation: quickExamMinScore,
      partPoints: {
        PART_I: quickExamP1Pts,
        PART_II: quickExamP2Pts,
        PART_III: quickExamP3Pts
      },
      questions: questionsWithMeta,
      createdAt: new Date().toISOString()
    };

    if (onCreateQuickExam) {
      onCreateQuickExam(exam, questionsWithMeta);
    } else {
      onCommitQuestions(questionsWithMeta, 'MERGE');
    }

    setCreatedExam(exam);
    setIsQuickExamModalOpen(false);
    setIsShareModalOpen(true);
  };

  // Generate shareable link
  const shareableUrl = useMemo(() => {
    if (!createdExam) return '';
    return `${window.location.origin}${window.location.pathname}?exam=${createdExam.id}`;
  }, [createdExam]);

  // Filtered list in preview
  const filteredQuestions = parseResult
    ? parseResult.questions.filter((q) => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'WARNINGS') return q.validationWarnings && q.validationWarnings.length > 0;
        return q.part === activeFilter;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Introduction Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
                GDPT 2018 · Lớp 6 đến 12
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Nhập đề Word vào Ngân hàng câu hỏi &amp; Phân loại chi tiết
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Trích xuất tự động công thức toán học OMML (KaTeX), hình vẽ đồ thị, bảng đáp án chuyển vị và phân loại rõ ràng theo: <strong>Môn học → Khối lớp (6-12) → Chương → Bài → Chủ đề → Mức độ nhận thức</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadPredefinedSample('FULL_3_PARTS')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Nạp mẫu Hóa 11 (3 phần)
            </button>
            <button
              type="button"
              onClick={() => loadPredefinedSample('ONLY_PART_I')}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Chỉ Phần I
            </button>
            <button
              type="button"
              onClick={() => loadPredefinedSample('ONLY_PART_II')}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Chỉ Phần II
            </button>
            <button
              type="button"
              onClick={() => loadPredefinedSample('ONLY_PART_III')}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Chỉ Phần III
            </button>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.005]'
            : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>

        <h3 className="text-base font-semibold text-slate-900">
          Kéo thả tệp đề Word (.docx) vào đây, hoặc nhấn để chọn tệp từ máy tính
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 max-w-lg mx-auto">
          Tự động trích xuất công thức LaTeX qua JSZip OMML, bóc tách hình vẽ sơ đồ, đối chiếu bảng đáp án và phân loại mức độ [BIẾT], [HIỂU], [VẬN DỤNG], [VẬN DỤNG CAO].
        </p>

        {file && (
          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>{file.name}</span>
            <span className="text-slate-400 tabular-nums">({Math.round(file.size / 1024)} KB)</span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isProcessing && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
          <div className="text-sm font-semibold text-slate-800">Đang phân tích cấu trúc tệp Word &amp; giải mã công thức...</div>
          <div className="text-xs text-slate-500">
            Trích xuất công thức Office Math OMML, nhận diện hình vẽ, bảng đáp án chuyển vị và hướng dẫn giải.
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-xs text-emerald-700 hover:underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Detected Suggestion Banner */}
      {detectedSuggestion && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-900">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="font-bold">Đề xuất nhận diện từ file Word:</span>{' '}
              <span>Môn {detectedSuggestion.subject} · Lớp {detectedSuggestion.grade} · Chương: <strong>{detectedSuggestion.chapter}</strong></span>
              {detectedSuggestion.lesson && <span> · Bài: <strong>{detectedSuggestion.lesson}</strong></span>}
              {detectedSuggestion.isNewChapter && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  Chương mới
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAcceptSuggestion}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer"
            >
              Áp dụng đề xuất
            </button>
            <button
              type="button"
              onClick={() => setDetectedSuggestion(null)}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      {/* Main Review & Category Mapping Section */}
      {parseResult && !isProcessing && (
        <div className="space-y-6">
          {/* FOLDER & CATEGORY SELECTION STRIP */}
          <div className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Phân loại danh mục học tập (Môn học → Khối lớp 6-12 → Chương → Bài → Chủ đề)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Thêm trực tiếp Môn, Lớp, Chương, Bài ngay tại đây mà không cần rời khỏi màn hình.
                  </p>
                </div>
              </div>

              {/* Mode Toggle: Mode A vs Mode B */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setClassificationMode('FILE_WIDE')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    classificationMode === 'FILE_WIDE'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tất cả câu hỏi trong file được gán chung thư mục này"
                >
                  Chế độ A (Cả file)
                </button>
                <button
                  type="button"
                  onClick={() => setClassificationMode('PER_QUESTION')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    classificationMode === 'PER_QUESTION'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Gán chương/bài riêng cho từng câu hỏi (cho đề tổng hợp nhiều chương)"
                >
                  Chế độ B (Từng câu)
                </button>
              </div>
            </div>

            {classificationMode === 'PER_QUESTION' && (
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Đang ở Chế độ B (Phân loại từng câu):</strong> Thầy/Cô có thể gán Chương và Bài học riêng cho từng câu hỏi bên dưới. Các câu không chọn riêng sẽ lấy theo phân loại mặc định này.
                </span>
              </div>
            )}

            {/* 4 Hierarchical Selectors with Inline "+ Thêm mới" Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* 1. Môn học */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Môn học</label>
                  <button
                    type="button"
                    onClick={() => setIsAddSubjectModalOpen(true)}
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm môn</span>
                  </button>
                </div>
                <select
                  value={targetSubject}
                  onChange={(e) => setTargetSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white"
                >
                  {categories.map((subj) => (
                    <option key={subj.id} value={subj.name}>{subj.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. Khối lớp (Lớp 6 đến Lớp 12) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp (Lớp 6 – 12)</label>
                <select
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:bg-white"
                >
                  {[6, 7, 8, 9, 10, 11, 12].map((gr) => (
                    <option key={gr} value={gr}>Lớp {gr}</option>
                  ))}
                </select>
              </div>

              {/* 3. Chương / Chuyên đề */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Chương / Chuyên đề</label>
                  <button
                    type="button"
                    onClick={() => setIsAddChapterModalOpen(true)}
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm chương</span>
                  </button>
                </div>
                <select
                  value={targetChapter}
                  onChange={(e) => setTargetChapter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 truncate focus:bg-white"
                >
                  {availableChapters.map((ch) => (
                    <option key={ch.id} value={ch.name}>{ch.name}</option>
                  ))}
                  {availableChapters.length === 0 && (
                    <option value="Chương chung">Chương chung / Chưa phân loại</option>
                  )}
                </select>
              </div>

              {/* 4. Bài học */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Bài học cụ thể</label>
                  <button
                    type="button"
                    onClick={() => setIsAddLessonModalOpen(true)}
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm bài</span>
                  </button>
                </div>
                <select
                  value={targetLesson}
                  onChange={(e) => setTargetLesson(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 truncate focus:bg-white"
                >
                  {availableLessons.map((les) => (
                    <option key={les.id} value={les.name}>{les.name}</option>
                  ))}
                  {availableLessons.length === 0 && (
                    <option value="Toàn bộ chương">Toàn bộ chương / Tổng hợp</option>
                  )}
                </select>
              </div>
            </div>

            {/* Quick Action Button for Mode A */}
            {classificationMode === 'FILE_WIDE' && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyFolderToAll}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Áp dụng phân loại này cho toàn bộ {parseResult.questions.length} câu</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Ribbon: Commit to Bank or Create Online Exam */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-900">
                Sẵn sàng lưu {parseResult.questions.length} câu hỏi vào hệ thống
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Phần I: {parseResult.partsFound.part1} câu</span>
                <span>·</span>
                <span>Phần II: {parseResult.partsFound.part2} câu</span>
                <span>·</span>
                <span>Phần III: {parseResult.partsFound.part3} câu</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <select
                  value={commitMode}
                  onChange={(e) => setCommitMode(e.target.value as any)}
                  className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="MERGE">Hợp nhất với ngân hàng hiện có</option>
                  <option value="REPLACE">Thay thế toàn bộ ngân hàng</option>
                </select>

                <button
                  type="button"
                  onClick={handleCommitToBank}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Lưu vào Ngân hàng câu hỏi
                </button>
              </div>

              <span className="text-slate-300 hidden sm:inline">|</span>

              <button
                type="button"
                onClick={handleOpenQuickExamModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Tạo đề thi online ngay từ file này</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  activeFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tất cả ({parseResult.questions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('PART_I')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  activeFilter === 'PART_I' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Phần I ({parseResult.partsFound.part1})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('PART_II')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  activeFilter === 'PART_II' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Phần II ({parseResult.partsFound.part2})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('PART_III')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  activeFilter === 'PART_III' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Phần III ({parseResult.partsFound.part3})
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => {
              const isExplOpen = !!expandedExpl[q.id];
              const qOverride = perQuestionMeta[q.id];

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-xl border transition-all ${
                    !q.isVerified ? 'border-amber-300' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Question Header Strip */}
                  <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-900">Câu {idx + 1}</span>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-indigo-700">
                          {q.part === 'PART_I' ? 'Phần I (4 Lựa chọn)' : q.part === 'PART_II' ? 'Phần II (Đúng/Sai)' : 'Phần III (Trả lời ngắn)'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {q.customLevelTag || `[${COGNITIVE_LEVEL_LABELS[q.level].toUpperCase()}]`}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-600 font-medium">
                          {qOverride?.chapter || q.chapter || targetChapter}
                        </span>
                      </div>
                    </div>

                    {!q.isVerified && (
                      <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Chưa xác nhận đáp án
                      </span>
                    )}
                  </div>

                  {/* Mode B: Per-Question Category Selector Strip */}
                  {classificationMode === 'PER_QUESTION' && (
                    <div className="px-5 py-2.5 bg-indigo-50/40 border-b border-indigo-100 flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-bold text-indigo-900 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Phân loại riêng câu {idx + 1}:</span>
                      </span>

                      {/* Select Chapter for this question */}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 text-[11px]">Chương:</span>
                        <select
                          value={qOverride?.chapter || targetChapter}
                          onChange={(e) => {
                            const newCh = e.target.value;
                            setPerQuestionMeta((prev) => ({
                              ...prev,
                              [q.id]: {
                                ...(prev[q.id] || {}),
                                chapter: newCh
                              }
                            }));
                          }}
                          className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-md text-slate-800"
                        >
                          {availableChapters.map((ch) => (
                            <option key={ch.id} value={ch.name}>{ch.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Select Lesson for this question */}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 text-[11px]">Bài:</span>
                        <select
                          value={qOverride?.lesson || targetLesson}
                          onChange={(e) => {
                            const newLs = e.target.value;
                            setPerQuestionMeta((prev) => ({
                              ...prev,
                              [q.id]: {
                                ...(prev[q.id] || {}),
                                chapter: qOverride?.chapter || targetChapter,
                                lesson: newLs
                              }
                            }));
                          }}
                          className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-md text-slate-800"
                        >
                          {availableLessons.map((ls) => (
                            <option key={ls.id} value={ls.name}>{ls.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Question Content */}
                  <div className="p-5 space-y-3">
                    <div className="text-sm font-medium text-slate-900 leading-relaxed">
                      <MathView content={q.content} />
                    </div>

                    {q.images && q.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 py-1">
                        {q.images.map((img, iIdx) => (
                          <img key={iIdx} src={img} alt="Hình vẽ" className="max-h-48 rounded-lg border border-slate-200" />
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
                              <span className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 text-slate-600'
                              }`}>
                                {opt.label}
                              </span>
                              <div className="flex-1 pt-0.5">
                                <MathView content={opt.content} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Part II True/False */}
                    {q.part === 'PART_II' && q.items && (
                      <div className="space-y-1.5 pt-2">
                        {q.items.map((item) => (
                          <div
                            key={item.label}
                            className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-200 flex items-start justify-between gap-3 text-xs"
                          >
                            <div className="flex items-start gap-2 flex-1">
                              <span className="font-bold text-slate-900 shrink-0">{item.label})</span>
                              <div className="flex-1 text-slate-800">
                                <MathView content={item.content} />
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.correctAnswer === 'D' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                            }`}>
                              {item.correctAnswer === 'D' ? 'Đúng (Đ)' : 'Sai (S)'}
                            </span>
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
                          onClick={() => setExpandedExpl((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
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
      )}

      {/* MODAL: Thêm môn học mới */}
      {isAddSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <form onSubmit={handleCreateSubject} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Thêm Môn học mới</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên môn học</label>
              <input
                type="text"
                required
                autoFocus
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                placeholder="VD: Tin học, Ngoại ngữ..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddSubjectModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                Tạo môn học
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Thêm chương mới */}
      {isAddChapterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <form onSubmit={handleCreateChapter} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Thêm Chương mới vào {targetSubject} - Lớp {targetGrade}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên chương / Chuyên đề</label>
              <input
                type="text"
                required
                autoFocus
                value={newChapterInput}
                onChange={(e) => setNewChapterInput(e.target.value)}
                placeholder="VD: Chương 4: Hợp chất hữu cơ..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddChapterModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                Tạo chương
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Thêm bài học mới */}
      {isAddLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <form onSubmit={handleCreateLesson} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Thêm Bài học mới vào: {targetChapter}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên bài học</label>
              <input
                type="text"
                required
                autoFocus
                value={newLessonInput}
                onChange={(e) => setNewLessonInput(e.target.value)}
                placeholder="VD: Bài 2. Sự điện li trong dung dịch..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddLessonModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                Tạo bài học
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Exam Modal from WordImportView */}
      {isQuickExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <form onSubmit={handlePublishQuickExam} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Thiết lập & Xuất bản bài thi online nhanh</h3>
              <button type="button" onClick={() => setIsQuickExamModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên bài thi</label>
                <input
                  type="text"
                  required
                  value={quickExamTitle}
                  onChange={(e) => setQuickExamTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={quickExamDuration}
                    onChange={(e) => setQuickExamDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu (tùy chọn)</label>
                  <input
                    type="text"
                    value={quickExamPasscode}
                    onChange={(e) => setQuickExamPasscode(e.target.value)}
                    placeholder="Không khóa"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsQuickExamModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                Xuất bản & Lấy Link làm bài
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && createdExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Đã tạo bài thi online thành công!</h3>
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center space-y-1">
              <div className="text-[11px] text-indigo-700 font-semibold uppercase">Mã PIN phòng thi</div>
              <div className="text-3xl font-mono font-extrabold text-indigo-900">{createdExam.pinCode}</div>
              <button
                type="button"
                onClick={() => {
                  if (createdExam.pinCode) {
                    navigator.clipboard.writeText(createdExam.pinCode);
                    setCopiedPin(true);
                    setTimeout(() => setCopiedPin(false), 2000);
                  }
                }}
                className="text-xs font-semibold text-indigo-600 underline cursor-pointer"
              >
                {copiedPin ? 'Đã sao chép!' : 'Sao chép mã PIN'}
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Link trực tiếp:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono truncate"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareableUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                >
                  {copiedLink ? 'Đã chép!' : 'Chép link'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsShareModalOpen(false);
                  if (onStartExamDirectly && createdExam) {
                    onStartExamDirectly(createdExam);
                  }
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Vào phòng thi thử nghiệm ngay</span>
              </button>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="w-full py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordImportView;
