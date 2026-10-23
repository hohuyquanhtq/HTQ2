import React, { useState, useRef } from 'react';
import { Question, PartType, CognitiveLevel, COGNITIVE_LEVEL_LABELS } from '../types';
import { parseDocxFile, ParseResult } from '../utils/docxParser';
import { SAMPLE_CHEMISTRY_QUESTIONS } from '../utils/sampleExamData';
import MathView from './MathView';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Trash2,
  Edit,
  ArrowRight,
  Info,
  Sparkles,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';

interface WordImportViewProps {
  onCommitQuestions: (newQuestions: Question[], mode: 'MERGE' | 'REPLACE') => void;
}

export const WordImportView: React.FC<WordImportViewProps> = ({ onCommitQuestions }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | PartType | 'WARNINGS'>('ALL');
  const [commitMode, setCommitMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } catch (err: any) {
      alert(`Lỗi khi đọc file DOCX: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Load predefined sample test files for instant testing based on user's exact attached PDFs
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
        docTitle = 'Chủ đề Cân bằng hóa học - Phần I: Trắc nghiệm 4 lựa chọn (8 câu đủ 4 mức độ: Biết, Hiểu, Vận dụng, Vận dụng cao)';
      } else if (type === 'ONLY_PART_II') {
        filtered = JSON.parse(JSON.stringify(SAMPLE_CHEMISTRY_QUESTIONS.filter((q) => q.part === 'PART_II')));
        docTitle = 'Cân bằng hóa học - Phần II: Trắc nghiệm Đúng/Sai (2 câu: [HIỂU – VẬN DỤNG], [VẬN DỤNG – VẬN DỤNG CAO])';
      } else if (type === 'ONLY_PART_III') {
        filtered = JSON.parse(JSON.stringify(SAMPLE_CHEMISTRY_QUESTIONS.filter((q) => q.part === 'PART_III')));
        docTitle = 'Cân bằng hóa học - Phần III: Trả lời ngắn (2 câu: [VẬN DỤNG], [VẬN DỤNG CAO])';
      }

      setFile(new File(['sample'], `${docTitle}.docx`, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      setParseResult({
        title: docTitle,
        subject: 'Hóa học',
        grade: 11,
        durationMinutes: 50,
        chapter: 'Chủ đề Cân bằng hóa học',
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
    }, 300);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Question editing in preview
  const handleUpdateQuestion = (idx: number, updated: Question) => {
    if (!parseResult) return;
    const newQs = [...parseResult.questions];
    newQs[idx] = updated;
    setParseResult({ ...parseResult, questions: newQs });
  };

  const handleDeleteQuestion = (idx: number) => {
    if (!parseResult) return;
    const newQs = parseResult.questions.filter((_, i) => i !== idx);
    setParseResult({ ...parseResult, questions: newQs });
  };

  // Commit to Question Bank
  const handleCommit = () => {
    if (!parseResult || parseResult.questions.length === 0) return;
    onCommitQuestions(parseResult.questions, commitMode);
    setSuccessNotice(
      `Đã nạp thành công ${parseResult.questions.length} câu hỏi vào ngân hàng (${commitMode === 'MERGE' ? 'Hợp nhất' : 'Ghi đè'})!`
    );
  };

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
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Nhập đề kiểm tra từ Microsoft Word (.docx)
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Bộ phân tích thông minh theo chuẩn Chương trình GDPT 2018. 
              <strong> Không bắt buộc đề phải đủ 3 phần:</strong> hỗ trợ nhập đề chỉ gồm trắc nghiệm 4 lựa chọn, chỉ Đúng/Sai, chỉ trả lời ngắn, hoặc bất kỳ sự kết hợp nào. Tự động nhận diện bảng đáp án và hướng dẫn giải.
            </p>
          </div>

          {/* Quick Sample Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-medium mr-1">Thử mẫu nhanh:</span>
            <button
              onClick={() => loadPredefinedSample('FULL_3_PARTS')}
              className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200/60"
            >
              Đầy đủ 3 phần
            </button>
            <button
              onClick={() => loadPredefinedSample('ONLY_PART_I')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Chỉ Phần I
            </button>
            <button
              onClick={() => loadPredefinedSample('ONLY_PART_II')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Chỉ Phần II
            </button>
            <button
              onClick={() => loadPredefinedSample('ONLY_PART_III')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Chỉ Phần III
            </button>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
          Kéo thả tệp đề Word (.docx) vào đây, hoặc nhấn để chọn tệp
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 max-w-lg mx-auto">
          Hỗ trợ đọc bảng đáp án dạng lưới (Part I: C, A, B; Part II: a-Đ, b-S, c-Đ, d-Đ; Part III: số ngắn), công thức LaTeX, phương trình ion và hướng dẫn giải.
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
          <div className="text-sm font-semibold text-slate-800">Đang phân tích cấu trúc tệp Word...</div>
          <div className="text-xs text-slate-500">
            Trích xuất công thức hóa học, nhận diện tiêu đề các phần, đối chiếu bảng đáp án và giải chi tiết.
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
            className="text-xs text-emerald-700 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Analysis Result & Review Section */}
      {parseResult && !isProcessing && (
        <div className="space-y-6">
          {/* File Analysis Summary Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{parseResult.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>Môn: {parseResult.subject}</span>
                  <span aria-hidden="true">·</span>
                  <span>Khối: {parseResult.grade}</span>
                  <span aria-hidden="true">·</span>
                  <span>Thời gian: {parseResult.durationMinutes} phút</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-indigo-600 font-semibold">{parseResult.questions.length} câu hỏi nhận diện được</span>
                </div>
              </div>

              {/* Commit Action Buttons */}
              <div className="flex items-center gap-3">
                <select
                  value={commitMode}
                  onChange={(e) => setCommitMode(e.target.value as any)}
                  className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                >
                  <option value="MERGE">Hợp nhất với ngân hàng hiện tại</option>
                  <option value="REPLACE">Ghi đè thay thế toàn bộ ngân hàng</option>
                </select>

                <button
                  onClick={handleCommit}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                >
                  <span>Xác nhận nhập vào Ngân hàng</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Detected Components Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500">Phần I (4 Lựa chọn)</div>
                <div className="text-lg font-bold text-indigo-700 mt-0.5 tabular-nums">
                  {parseResult.partsFound.part1} câu
                </div>
                <div className="text-[11px] text-slate-400">
                  {parseResult.partsFound.part1 > 0 ? 'Đã nhận diện' : 'Không có trong file'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500">Phần II (Đúng / Sai)</div>
                <div className="text-lg font-bold text-emerald-700 mt-0.5 tabular-nums">
                  {parseResult.partsFound.part2} câu
                </div>
                <div className="text-[11px] text-slate-400">
                  {parseResult.partsFound.part2 > 0 ? 'Đã nhận diện' : 'Không có trong file'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500">Phần III (Trả lời ngắn)</div>
                <div className="text-lg font-bold text-amber-700 mt-0.5 tabular-nums">
                  {parseResult.partsFound.part3} câu
                </div>
                <div className="text-[11px] text-slate-400">
                  {parseResult.partsFound.part3 > 0 ? 'Đã nhận diện' : 'Không có trong file'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500">Bảng đáp án Word</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">
                  {parseResult.partsFound.hasAnswerGrid ? 'Tìm thấy' : 'Không có'}
                </div>
                <div className="text-[11px] text-slate-400">Đối chiếu tự động</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500">Hướng dẫn giải</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">
                  {parseResult.partsFound.hasExplanations ? 'Tìm thấy' : 'Không có'}
                </div>
                <div className="text-[11px] text-slate-400">Gắn vào từng câu</div>
              </div>
            </div>

            {/* Note on flexibility */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Lưu ý:</strong> Giáo viên có thể trực tiếp chỉnh sửa nội dung, phương án, đánh dấu đáp án đúng hoặc bổ sung giải thích trước khi lưu vào ngân hàng.
              </span>
            </div>
          </div>

          {/* Filter Bar in Preview */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">
              Bộ lọc xem trước:
            </span>
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Tất cả ({parseResult.questions.length})
            </button>

            {parseResult.partsFound.part1 > 0 && (
              <button
                onClick={() => setActiveFilter('PART_I')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeFilter === 'PART_I'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Phần I ({parseResult.partsFound.part1})
              </button>
            )}

            {parseResult.partsFound.part2 > 0 && (
              <button
                onClick={() => setActiveFilter('PART_II')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeFilter === 'PART_II'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Phần II ({parseResult.partsFound.part2})
              </button>
            )}

            {parseResult.partsFound.part3 > 0 && (
              <button
                onClick={() => setActiveFilter('PART_III')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeFilter === 'PART_III'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Phần III ({parseResult.partsFound.part3})
              </button>
            )}

            <button
              onClick={() => setActiveFilter('WARNINGS')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeFilter === 'WARNINGS'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Cần chú ý ({parseResult.questions.filter((q) => q.validationWarnings && q.validationWarnings.length > 0).length})
            </button>
          </div>

          {/* Questions Editor & Preview List */}
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Header */}
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900">Câu {idx + 1}</span>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-indigo-700">
                        {q.part === 'PART_I' ? 'Phần I' : q.part === 'PART_II' ? 'Phần II' : 'Phần III'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {q.customLevelTag || `[${COGNITIVE_LEVEL_LABELS[q.level].toUpperCase()}]`}
                      </span>
                      <span aria-hidden="true">·</span>
                      {/* Level selector */}
                      <select
                        value={q.level}
                        onChange={(e) =>
                          handleUpdateQuestion(idx, {
                            ...q,
                            level: e.target.value as CognitiveLevel
                          })
                        }
                        className="text-xs font-medium bg-transparent border-none text-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="NHAN_BIET">Nhận biết</option>
                        <option value="THONG_HIEU">Thông hiểu</option>
                        <option value="VAN_DUNG">Vận dụng</option>
                        <option value="VAN_DUNG_CAO">Vận dụng cao</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Xóa câu này khỏi danh sách nhập"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Warnings */}
                  {q.validationWarnings && q.validationWarnings.length > 0 && (
                    <div className="p-2.5 bg-amber-50 rounded-lg text-xs text-amber-800 space-y-1">
                      {q.validationWarnings.map((w, wIdx) => (
                        <div key={wIdx} className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Question editable prompt */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Đề bài câu hỏi:</label>
                    <textarea
                      rows={2}
                      value={q.content}
                      onChange={(e) => handleUpdateQuestion(idx, { ...q, content: e.target.value })}
                      className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                    />
                    <div className="mt-1 text-xs text-slate-500">
                      <span className="font-medium">Hiển thị công thức: </span>
                      <MathView content={q.content} inline />
                    </div>
                  </div>

                  {/* Embedded Images / Diagrams */}
                  {q.images && q.images.length > 0 && (
                    <div className="flex flex-wrap gap-3 py-2">
                      {q.images.map((imgSrc, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={imgSrc}
                          alt="Hình vẽ câu hỏi"
                          className="max-h-56 max-w-full rounded-lg border border-slate-200 object-contain bg-white shadow-xs"
                        />
                      ))}
                    </div>
                  )}

                  {/* Part I: Options editing & choosing correct */}
                  {q.part === 'PART_I' && q.options && (
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-semibold text-slate-600">
                        Phương án (Chọn nút tròn để chỉ định đáp án đúng):
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = q.correctOption?.toUpperCase() === opt.label.toUpperCase();
                          return (
                            <div
                              key={opt.label}
                              className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                                isCorrect ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct_preview_${q.id}`}
                                checked={isCorrect}
                                onChange={() =>
                                  handleUpdateQuestion(idx, {
                                    ...q,
                                    correctOption: opt.label,
                                    validationWarnings: (q.validationWarnings || []).filter((w) => !w.includes('đáp án đúng'))
                                  })
                                }
                                className="text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-xs font-bold text-slate-700">{opt.label}.</span>
                              <input
                                type="text"
                                value={opt.content}
                                onChange={(e) => {
                                  const newOpts = [...q.options!];
                                  newOpts[oIdx] = { ...opt, content: e.target.value };
                                  handleUpdateQuestion(idx, { ...q, options: newOpts });
                                }}
                                className="flex-1 text-xs bg-white border border-slate-200 rounded px-2 py-1"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Part II: Sub-items a, b, c, d editing & True/False toggles */}
                  {q.part === 'PART_II' && q.items && (
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-semibold text-slate-600">
                        Các ý Đúng / Sai (chọn Đ hoặc S cho từng ý):
                      </div>
                      {q.items.map((item, iIdx) => (
                        <div
                          key={item.label}
                          className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3"
                        >
                          <span className="text-xs font-bold text-slate-800">{item.label})</span>
                          <input
                            type="text"
                            value={item.content}
                            onChange={(e) => {
                              const newItems = [...q.items!];
                              newItems[iIdx] = { ...item, content: e.target.value };
                              handleUpdateQuestion(idx, { ...q, items: newItems });
                            }}
                            className="flex-1 text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...q.items!];
                                newItems[iIdx] = { ...item, correctAnswer: 'D' };
                                handleUpdateQuestion(idx, { ...q, items: newItems });
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                                item.correctAnswer === 'D'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              Đúng (Đ)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...q.items!];
                                newItems[iIdx] = { ...item, correctAnswer: 'S' };
                                handleUpdateQuestion(idx, { ...q, items: newItems });
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                                item.correctAnswer === 'S'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              Sai (S)
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Part III: Short answer */}
                  {q.part === 'PART_III' && (
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xs font-medium text-slate-600">Đáp án ngắn:</span>
                      <input
                        type="text"
                        value={q.shortAnswer || ''}
                        onChange={(e) =>
                          handleUpdateQuestion(idx, {
                            ...q,
                            shortAnswer: e.target.value,
                            validationWarnings: (q.validationWarnings || []).filter((w) => !w.includes('đáp án ngắn'))
                          })
                        }
                        placeholder="VD: 2,5"
                        className="px-3 py-1.5 text-xs font-mono font-bold bg-amber-50 border border-amber-300 rounded text-amber-900 w-36"
                      />
                    </div>
                  )}

                  {/* Explanation */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Hướng dẫn giải chi tiết:
                    </label>
                    <textarea
                      rows={2}
                      value={q.explanation || ''}
                      onChange={(e) => handleUpdateQuestion(idx, { ...q, explanation: e.target.value })}
                      placeholder="Bổ sung lời giải cho câu hỏi..."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Unparsed content fallback section */}
          {parseResult.unparsedBlocks && parseResult.unparsedBlocks.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Nội dung chưa thể phân tích tự động ({parseResult.unparsedBlocks.length} đoạn)</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Các đoạn văn bản dưới đây không khớp với cấu trúc Câu 1, Câu 2... hoặc thiếu phương án A-D. Hệ thống bảo toàn nội dung để giáo viên không bị mất dữ liệu:
              </p>
              <div className="space-y-2">
                {parseResult.unparsedBlocks.map((blk, bIdx) => (
                  <pre
                    key={bIdx}
                    className="p-3 bg-white rounded border border-amber-200 text-xs text-slate-700 whitespace-pre-wrap font-sans overflow-x-auto"
                  >
                    {blk}
                  </pre>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Commit Bar */}
          <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-lg flex items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              Đang xem xét <strong className="text-slate-900">{parseResult.questions.length}</strong> câu hỏi đã phân tích.
            </div>
            <button
              onClick={handleCommit}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors whitespace-nowrap"
            >
              <span>Xác nhận nạp vào Ngân hàng câu hỏi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordImportView;
