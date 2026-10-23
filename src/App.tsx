import React, { useState, useEffect } from 'react';
import { Question, Exam, ExamResult } from './types';
import { 
  loadQuestions, 
  saveQuestions, 
  loadExams, 
  saveExams, 
  saveResult 
} from './utils/storage';
import { DEFAULT_SAMPLE_EXAM } from './utils/sampleExamData';
import Header, { ActiveTab } from './components/Header';
import QuestionBankView from './components/QuestionBankView';
import WordImportView from './components/WordImportView';
import ExamMatrixView from './components/ExamMatrixView';
import OnlineExamView from './components/OnlineExamView';
import ExamResultView from './components/ExamResultView';
import DataManagementView from './components/DataManagementView';

export function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('bank');

  // Examination flow states
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [currentResult, setCurrentResult] = useState<ExamResult | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const loadedQuestions = loadQuestions();
    const loadedExams = loadExams();
    setQuestions(loadedQuestions);
    setExams(loadedExams);
  }, []);

  // Question bank handlers
  const handleSaveQuestion = (updated: Question) => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === updated.id);
      let next: Question[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = updated;
      } else {
        next = [updated, ...prev];
      }
      saveQuestions(next);
      return next;
    });
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => {
      const next = prev.filter((q) => q.id !== id);
      saveQuestions(next);
      return next;
    });
  };

  const handleDuplicateQuestion = (q: Question) => {
    const duplicated: Question = {
      ...JSON.parse(JSON.stringify(q)),
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      content: `${q.content} (Bản sao)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setQuestions((prev) => {
      const next = [duplicated, ...prev];
      saveQuestions(next);
      return next;
    });
  };

  // Word import commit handler
  const handleCommitImport = (newQuestions: Question[], mode: 'MERGE' | 'REPLACE') => {
    setQuestions((prev) => {
      let next: Question[];
      if (mode === 'REPLACE') {
        next = newQuestions;
      } else {
        const existingIds = new Set(prev.map((q) => q.id));
        const filteredNew = newQuestions.filter((q) => !existingIds.has(q.id));
        next = [...prev, ...filteredNew];
      }
      saveQuestions(next);
      return next;
    });
    // Auto switch to bank to show results
    setActiveTab('bank');
  };

  // Exam handlers
  const handleSaveExam = (exam: Exam) => {
    setExams((prev) => {
      const next = [exam, ...prev.filter((e) => e.id !== exam.id)];
      saveExams(next);
      return next;
    });
  };

  const handleDeleteExam = (examId: string) => {
    setExams((prev) => {
      const next = prev.filter((e) => e.id !== examId);
      saveExams(next);
      return next;
    });
  };

  const handleStartExam = (exam: Exam) => {
    setCurrentExam(exam);
    setCurrentResult(null);
    setActiveTab('exam');
  };

  const handleQuickExam = () => {
    const examToRun = exams[0] || DEFAULT_SAMPLE_EXAM;
    handleStartExam(examToRun);
  };

  // Exam finished handler
  const handleFinishExam = (result: ExamResult) => {
    saveResult(result);
    setCurrentResult(result);
  };

  // Retake current exam
  const handleRetakeExam = () => {
    setCurrentResult(null);
  };

  // Refresh entire data
  const handleRefreshData = (newQuestions: Question[], newExams: Exam[]) => {
    setQuestions(newQuestions);
    setExams(newExams);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          // If navigating away from result, keep state or reset if desired
        }}
        questionCount={questions.length}
        onStartQuickExam={handleQuickExam}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: QUESTION BANK */}
        {activeTab === 'bank' && (
          <QuestionBankView
            questions={questions}
            onSaveQuestion={handleSaveQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onDuplicateQuestion={handleDuplicateQuestion}
          />
        )}

        {/* TAB 2: WORD IMPORT */}
        {activeTab === 'import' && (
          <WordImportView onCommitQuestions={handleCommitImport} />
        )}

        {/* TAB 3: MATRIX GENERATOR */}
        {activeTab === 'matrix' && (
          <ExamMatrixView
            questions={questions}
            exams={exams}
            onSaveExam={handleSaveExam}
            onDeleteExam={handleDeleteExam}
            onStartExam={handleStartExam}
          />
        )}

        {/* TAB 4: ONLINE EXAM / RESULT */}
        {activeTab === 'exam' && (
          <>
            {currentResult && currentExam ? (
              <ExamResultView
                result={currentResult}
                exam={currentExam}
                onRetakeExam={handleRetakeExam}
                onBackToBank={() => setActiveTab('bank')}
              />
            ) : currentExam ? (
              <OnlineExamView
                exam={currentExam}
                onFinishExam={handleFinishExam}
                onExitExam={() => setActiveTab('matrix')}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
                <h3 className="text-base font-bold text-slate-900">Chưa chọn đề thi nào</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Vui lòng chọn hoặc sinh một đề thi trong mục &quot;Sinh đề ma trận&quot;, hoặc bấm nút &quot;Thi ngay mẫu Hóa 11&quot;.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('matrix')}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Đến mục Sinh đề
                  </button>
                  <button
                    onClick={handleQuickExam}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    Thi đề mẫu Hóa 11
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 5: BACKUP & DATA MANAGEMENT */}
        {activeTab === 'data' && (
          <DataManagementView
            questions={questions}
            exams={exams}
            onRefreshData={handleRefreshData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">EduChem Studio</span>
            <span>·</span>
            <span>Quản lý Ngân hàng câu hỏi & Thi trực tuyến chuẩn GDPT 2018</span>
          </div>
          <div>
            Hỗ trợ Hóa học & Toán học THPT · Đọc đề Word linh hoạt · Tương thích KaTeX
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
