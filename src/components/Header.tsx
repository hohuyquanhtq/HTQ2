import React from 'react';
import { BookOpen, FileText, Grid, MonitorPlay, Database } from 'lucide-react';

export type ActiveTab = 'bank' | 'import' | 'matrix' | 'exam' | 'data';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  questionCount: number;
  onStartQuickExam: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  questionCount,
  onStartQuickExam
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('bank')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-indigo-700 transition-colors">
                E
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                EduChem Studio
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => onTabChange('bank')}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'bank'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Ngân hàng câu hỏi</span>
              <span className="text-xs text-slate-400">({questionCount})</span>
            </button>

            <button
              onClick={() => onTabChange('import')}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'import'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Nhập đề Word</span>
            </button>

            <button
              onClick={() => onTabChange('matrix')}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'matrix'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Sinh đề ma trận</span>
            </button>

            <button
              onClick={() => onTabChange('exam')}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'exam'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MonitorPlay className="w-4 h-4" />
              <span>Phòng thi trực tuyến</span>
            </button>

            <button
              onClick={() => onTabChange('data')}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'data'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Sao lưu & Dữ liệu</span>
            </button>
          </nav>

          {/* Zone 3: Primary CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onStartQuickExam}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              Thi ngay mẫu Hóa 11
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
