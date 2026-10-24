import React, { useState, useEffect } from 'react';
import { Question, Exam, ExamResult, UserSession } from './types';
import { 
  loadQuestions, 
  saveQuestions, 
  loadExams, 
  saveExams, 
  loadResults,
  saveResult 
} from './utils/storage';
import { getCurrentSession, clearCurrentSession, ensureDefaultAccounts } from './utils/auth';
import { DEFAULT_SAMPLE_EXAM } from './utils/sampleExamData';
import Header, { ActiveTab } from './components/Header';
import QuestionBankView from './components/QuestionBankView';
import WordImportView from './components/WordImportView';
import QuickExamBuilderView from './components/QuickExamBuilderView';
import ExamMatrixView from './components/ExamMatrixView';
import OnlineExamView from './components/OnlineExamView';
import ExamResultView from './components/ExamResultView';
import DataManagementView from './components/DataManagementView';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import { KeyRound, X, AlertCircle, ArrowRight, GraduationCap } from 'lucide-react';

export function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('bank');

  // User Authentication & Session
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => getCurrentSession());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Examination flow states
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [currentResult, setCurrentResult] = useState<ExamResult | null>(null);

  // PIN modal & joining state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Initialize data and check URL parameters on mount
  useEffect(() => {
    // Seed default accounts
    ensureDefaultAccounts();

    const loadedQuestions = loadQuestions();
    const loadedExams = loadExams();
    const loadedResults = loadResults();
    setQuestions(loadedQuestions);
    setExams(loadedExams);
    setExamResults(loadedResults);

    // If no user is logged in, show auth modal so they declare role/profile
    const session = getCurrentSession();
    if (!session) {
      setIsAuthModalOpen(true);
    } else {
      setCurrentUser(session);
    }

    // Auto load exam if query parameters exist in URL (?exam=id or ?pin=code)
    try {
      const params = new URLSearchParams(window.location.search);
      const examId = params.get('exam');
      const pin = params.get('pin');

      if (examId) {
        const found = loadedExams.find((e) => e.id === examId) || 
                      (DEFAULT_SAMPLE_EXAM.id === examId ? DEFAULT_SAMPLE_EXAM : null);
        if (found) {
          setCurrentExam(found);
          setCurrentResult(null);
          setActiveTab('exam');
        }
      } else if (pin) {
        const cleanPin = pin.trim();
        const found = loadedExams.find((e) => e.pinCode === cleanPin) || 
                      (DEFAULT_SAMPLE_EXAM.pinCode === cleanPin ? DEFAULT_SAMPLE_EXAM : null);
        if (found) {
          setCurrentExam(found);
          setCurrentResult(null);
          setActiveTab('exam');
        }
      }
    } catch (err) {
      console.error('Lỗi khi đọc tham số URL:', err);
    }
  }, []);

  // Auth Handlers
  const handleAuthSuccess = (session: UserSession) => {
    setCurrentUser(session);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    clearCurrentSession();
    setCurrentUser(null);
    setIsProfileModalOpen(false);
    setIsAuthModalOpen(true);
  };

  const handleUpdateUser = (updated: UserSession) => {
    setCurrentUser(updated);
  };

  // Join exam by PIN
  const handleJoinByPin = (pinCode: string) => {
    const cleanPin = pinCode.trim();
    if (!cleanPin) {
      setPinError('Vui lòng nhập mã PIN');
      return;
    }

    const found = exams.find((e) => e.pinCode === cleanPin || e.id === cleanPin) ||
                  (DEFAULT_SAMPLE_EXAM.pinCode === cleanPin || DEFAULT_SAMPLE_EXAM.id === cleanPin ? DEFAULT_SAMPLE_EXAM : null);

    if (found) {
      setPinError(null);
      setIsPinModalOpen(false);
      setEnteredPin('');
      setCurrentExam(found);
      setCurrentResult(null);
      setActiveTab('exam');
    } else {
      setPinError(`Không tìm thấy phòng thi với mã PIN "${cleanPin}". Vui lòng kiểm tra lại.`);
    }
  };

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

  // Quick Exam created from Word import
  const handleCreateQuickExam = (exam: Exam, newQuestions: Question[]) => {
    // 1. Commit questions to bank
    setQuestions((prev) => {
      const existingIds = new Set(prev.map((q) => q.id));
      const filteredNew = newQuestions.filter((q) => !existingIds.has(q.id));
      const next = [...prev, ...filteredNew];
      saveQuestions(next);
      return next;
    });

    // 2. Save exam to exam list
    setExams((prev) => {
      const next = [exam, ...prev.filter((e) => e.id !== exam.id)];
      saveExams(next);
      return next;
    });
  };

  // Quick exam builder published handler
  const handlePublishQuickExam = (exam: Exam, snapshotQuestions: Question[]) => {
    // 1. Commit questions to bank if not already present
    setQuestions((prev) => {
      const existingIds = new Set(prev.map((q) => q.id));
      const filteredNew = snapshotQuestions.filter((q) => !existingIds.has(q.id));
      if (filteredNew.length === 0) return prev;
      const next = [...prev, ...filteredNew];
      saveQuestions(next);
      return next;
    });

    // 2. Save exam to exam list
    setExams((prev) => {
      const next = [exam, ...prev.filter((e) => e.id !== exam.id)];
      saveExams(next);
      return next;
    });
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
    setActiveTab('quick-exam');
  };

  // Exam finished handler
  const handleFinishExam = (result: ExamResult) => {
    saveResult(result);
    setExamResults(loadResults());
    setCurrentResult(result);
    try {
      localStorage.setItem('educhem_last_exam_result', JSON.stringify({ resultId: result.id, examId: result.examId }));
    } catch {}
  };

  // Retake current exam
  const handleRetakeExam = () => {
    setCurrentResult(null);
    try {
      localStorage.removeItem('educhem_last_exam_result');
    } catch {}
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
        }}
        questionCount={questions.length}
        onStartQuickExam={handleQuickExam}
        onOpenPinModal={() => {
          setPinError(null);
          setIsPinModalOpen(true);
        }}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Mode Notice */}
        {currentUser?.role === 'STUDENT' && (activeTab === 'bank' || activeTab === 'import' || activeTab === 'matrix') && (
          <div className="mb-6 p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-emerald-950">Chế độ Học sinh ({currentUser.fullName}{currentUser.className ? ` - ${currentUser.className}` : ''})</span>
                <p className="text-emerald-700 mt-0.5">
                  Bạn có thể tham khảo ngân hàng câu hỏi và tham gia làm bài thi online. Quyền chỉnh sửa ngân hàng đề và sửa đáp án chuẩn dành riêng cho tài khoản Giáo viên.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('exam')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl whitespace-nowrap shadow-xs cursor-pointer self-start sm:self-center"
            >
              Vào phòng thi ngay
            </button>
          </div>
        )}

        {/* TAB 0: TẠO ĐỀ ONLINE NHANH TỪ WORD */}
        {activeTab === 'quick-exam' && (
          <QuickExamBuilderView
            onPublishExam={handlePublishQuickExam}
            onStartExamDirectly={handleStartExam}
          />
        )}

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
          <WordImportView 
            onCommitQuestions={handleCommitImport} 
            onCreateQuickExam={handleCreateQuickExam}
            onStartExamDirectly={handleStartExam}
          />
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
                onBackToBank={() => {
                  setCurrentResult(null);
                  setCurrentExam(null);
                  setActiveTab('bank');
                }}
              />
            ) : currentExam ? (
              <OnlineExamView
                exam={currentExam}
                currentUser={currentUser}
                onFinishExam={handleFinishExam}
                onExitExam={() => setActiveTab('matrix')}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6 shadow-xs">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                  <KeyRound className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">Vào phòng thi trực tuyến</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Nhập mã PIN 6 chữ số do giáo viên cung cấp để vào làm bài, hoặc chọn đề mẫu có sẵn.
                  </p>
                </div>

                {/* Inline PIN Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleJoinByPin(enteredPin);
                  }}
                  className="space-y-3 max-w-xs mx-auto"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={10}
                      value={enteredPin}
                      onChange={(e) => {
                        setEnteredPin(e.target.value);
                        setPinError(null);
                      }}
                      placeholder="Nhập mã PIN (vd: 839201)"
                      className="flex-1 px-4 py-2.5 text-center text-sm font-mono font-bold tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      Vào thi
                    </button>
                  </div>

                  {pinError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-1.5 text-left">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{pinError}</span>
                    </div>
                  )}
                </form>

                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Hoặc chọn nhanh
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      onClick={() => handleJoinByPin('839201')}
                      className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                    >
                      Mã mẫu: 839201 (Hóa 11)
                    </button>
                    <button
                      onClick={() => setActiveTab('import')}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Tạo đề từ Word
                    </button>
                    <button
                      onClick={() => setActiveTab('matrix')}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Sinh đề ma trận
                    </button>
                  </div>
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

      {/* PIN Entry Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Nhập mã PIN phòng thi</h3>
              </div>
              <button
                onClick={() => {
                  setIsPinModalOpen(false);
                  setPinError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Nhập mã PIN gồm 6 số do thầy/cô cung cấp để truy cập trực tiếp vào phòng thi.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleJoinByPin(enteredPin);
              }}
              className="space-y-4"
            >
              <div>
                <input
                  type="text"
                  maxLength={10}
                  autoFocus
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="Ví dụ: 839201"
                  className="w-full px-4 py-3 text-center text-lg font-mono font-bold tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              {pinError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEnteredPin('839201');
                    handleJoinByPin('839201');
                  }}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Dùng mã mẫu (839201)
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Vào làm bài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Authentication Modal (Login & Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onSuccess={handleAuthSuccess}
        onClose={() => setIsAuthModalOpen(false)}
        forced={!currentUser}
      />

      {/* User Profile & Password Modal */}
      {currentUser && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          user={currentUser}
          examResults={examResults}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
        />
      )}

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
