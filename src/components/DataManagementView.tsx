import React, { useState, useRef } from 'react';
import { Question, Exam } from '../types';
import { exportBackupJson, importBackupJson, saveQuestions, saveExams } from '../utils/storage';
import { SAMPLE_CHEMISTRY_QUESTIONS, DEFAULT_SAMPLE_EXAM } from '../utils/sampleExamData';
import { 
  Download, 
  Upload, 
  RotateCcw, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  ShieldCheck,
  FileJson,
  Layers
} from 'lucide-react';

interface DataManagementViewProps {
  questions: Question[];
  exams: Exam[];
  onRefreshData: (newQuestions: Question[], newExams: Exam[]) => void;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({
  questions,
  exams,
  onRefreshData
}) => {
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [mergeMode, setMergeMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle JSON file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = importBackupJson(text, questions, mergeMode);
      setImportStatus({
        success: res.success,
        message: res.message
      });
      if (res.success) {
        onRefreshData(res.newQuestions, exams);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // Reset to sample data
  const handleResetToSample = () => {
    saveQuestions(SAMPLE_CHEMISTRY_QUESTIONS);
    saveExams([DEFAULT_SAMPLE_EXAM]);
    onRefreshData(SAMPLE_CHEMISTRY_QUESTIONS, [DEFAULT_SAMPLE_EXAM]);
    setIsResetConfirmOpen(false);
    setImportStatus({
      success: true,
      message: 'Đã khôi phục thành công cơ sở dữ liệu mẫu chuẩn GDPT 2018 (Hóa học 11).'
    });
  };

  // Export Standalone Single-file HTML
  const handleExportStandaloneHtml = () => {
    const currentData = JSON.stringify({ questions, exams });
    const standaloneHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EduChem Studio - Quản lý Ngân hàng câu hỏi & Thi trực tuyến GDPT 2018 (Bản Offline)</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js"></script>
</head>
<body class="bg-slate-50 text-slate-800 p-8 antialiased">
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h1 class="text-2xl font-bold text-slate-900">EduChem Studio (Bản đóng gói Offline)</h1>
      <p class="text-sm text-slate-600 mt-1">Được xuất trực tiếp từ ứng dụng EduChem Studio. Chứa ${questions.length} câu hỏi và ${exams.length} đề thi.</p>
    </div>
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 class="text-lg font-bold text-slate-900 mb-4">Danh sách câu hỏi hiện hành:</h2>
      <div id="q-list" class="space-y-4"></div>
    </div>
  </div>
  <script>
    const data = ${currentData};
    const list = document.getElementById('q-list');
    data.questions.forEach((q, idx) => {
      const div = document.createElement('div');
      div.className = 'p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2';
      div.innerHTML = '<div class="font-bold text-sm text-indigo-700">Câu ' + (idx + 1) + ' (' + q.part + ' · ' + q.level + ')</div>' +
        '<div class="text-sm text-slate-900">' + q.content + '</div>' +
        (q.correctOption ? '<div class="text-xs text-emerald-700 font-bold">Đáp án: ' + q.correctOption + '</div>' : '') +
        (q.shortAnswer ? '<div class="text-xs text-amber-700 font-bold">Đáp án ngắn: ' + q.shortAnswer + '</div>' : '');
      list.appendChild(div);
    });
  </script>
</body>
</html>`;

    const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EduChem_Studio_Standalone_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Quản lý Dữ liệu, Sao lưu & Xuất bản
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Toàn bộ ngân hàng câu hỏi, ma trận đề và kết quả được lưu trữ cục bộ trên trình duyệt (LocalStorage / IndexedDB). 
          Bạn có thể tải bản sao lưu dạng JSON để chuyển đổi giữa các máy tính hoặc xuất file HTML độc lập.
        </p>
      </div>

      {/* Notification */}
      {importStatus && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-sm ${
            importStatus.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {importStatus.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{importStatus.message}</span>
          </div>
          <button
            onClick={() => setImportStatus(null)}
            className="text-xs underline opacity-80 hover:opacity-100"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Grid of Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export JSON Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileJson className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Xuất bản sao lưu (JSON)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tải toàn bộ {questions.length} câu hỏi và {exams.length} đề thi thành tệp JSON chuẩn để lưu trữ an toàn hoặc chia sẻ cho đồng nghiệp.
            </p>
          </div>
          <button
            onClick={() => exportBackupJson(questions, exams)}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải tệp sao lưu JSON (.json)</span>
          </button>
        </div>

        {/* Import JSON Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Nạp lại bản sao lưu (JSON)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Chọn tệp sao lưu JSON đã xuất trước đó. Hệ thống sẽ tự động xác minh cấu trúc phiên bản và ngăn chặn trùng lặp.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={mergeMode}
              onChange={(e) => setMergeMode(e.target.value as any)}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
            >
              <option value="MERGE">Hợp nhất (giữ câu cũ)</option>
              <option value="REPLACE">Ghi đè (thay toàn bộ)</option>
            </select>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Chọn tệp JSON
            </button>
          </div>
        </div>

        {/* Export Standalone HTML */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Xuất file HTML đơn độc lập</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Đóng gói toàn bộ cơ sở dữ liệu và thư viện vào một file `index.html` duy nhất để chạy offline trực tiếp trên mọi máy tính không cần máy chủ.
            </p>
          </div>
          <button
            onClick={handleExportStandaloneHtml}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải file index.html độc lập</span>
          </button>
        </div>

        {/* Factory Reset */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Khôi phục dữ liệu mẫu ban đầu</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Khôi phục lại kho câu hỏi gốc Hóa học 11 chuẩn GDPT 2018 (đầy đủ 3 phần trắc nghiệm, đúng/sai, trả lời ngắn và đề kiểm tra mẫu).
            </p>
          </div>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Khôi phục mẫu Hóa 11</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Khôi phục về dữ liệu gốc?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dữ liệu hiện tại trong trình duyệt sẽ được thay thế bằng bộ câu hỏi và đề thi mẫu chuẩn GDPT 2018. Bạn có muốn tiếp tục?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleResetToSample}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagementView;
