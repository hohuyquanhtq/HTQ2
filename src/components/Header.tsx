import React from 'react';
import { BookOpen, FileText, Grid, MonitorPlay, Database, KeyRound, Zap, User, GraduationCap } from 'lucide-react';
import { UserSession } from '../types';

export type ActiveTab = 'quick-exam' | 'bank' | 'import' | 'matrix' | 'exam' | 'data';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  questionCount: number;
  onStartQuickExam: () => void;
  onOpenPinModal?: () => void;
  currentUser: UserSession | null;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  questionCount,
  onStartQuickExam,
  onOpenPinModal,
  currentUser,
  onOpenProfile,
  onOpenAuth
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('bank')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-indigo-700 transition-colors">
                E
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap leading-tight">
                  EduChem Studio
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  Chuẩn GDPT 2018 · Lớp 6–12
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => onTabChange('quick-exam')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                activeTab === 'quick-exam'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                  : 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200/60'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Tạo đề online nhanh</span>
            </button>

            <button
              onClick={() => onTabChange('bank')}
              className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'bank'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Ngân hàng</span>
              <span className="text-xs text-slate-400">({questionCount})</span>
            </button>

            <button
              onClick={() => onTabChange('import')}
              className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
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
              className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
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
              className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'exam'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MonitorPlay className="w-4 h-4" />
              <span>Phòng thi</span>
            </button>

            <button
              onClick={() => onTabChange('data')}
              className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'data'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Dữ liệu</span>
            </button>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenPinModal && (
              <button
                onClick={onOpenPinModal}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer whitespace-nowrap"
                title="Nhập mã PIN 6 số để vào phòng thi"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mã PIN</span>
              </button>
            )}

            <button
              onClick={onStartQuickExam}
              className="hidden sm:inline-flex px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              Thi ngay mẫu Hóa 11
            </button>

            {/* User Account / Profile Button */}
            {currentUser ? (
              <button
                onClick={onOpenProfile}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  currentUser.role === 'TEACHER'
                    ? 'bg-indigo-50/80 hover:bg-indigo-100/90 border-indigo-200 text-indigo-950'
                    : 'bg-emerald-50/80 hover:bg-emerald-100/90 border-emerald-200 text-emerald-950'
                }`}
                title="Nhấn để xem hoặc chỉnh sửa hồ sơ cá nhân"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs ${
                    currentUser.role === 'TEACHER' ? 'bg-indigo-600' : 'bg-emerald-600'
                  }`}
                >
                  {currentUser.role === 'TEACHER' ? 'GV' : 'HS'}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <div className="text-xs font-bold leading-tight line-clamp-1 max-w-[120px]">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] opacity-75 font-mono leading-none mt-0.5">
                    {currentUser.role === 'TEACHER'
                      ? 'Giáo viên'
                      : currentUser.className || `@${currentUser.username}`}
                  </div>
                </div>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <User className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

