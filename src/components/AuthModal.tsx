import React, { useState } from 'react';
import { UserRole, UserSession } from '../types';
import { registerAccount, loginAccount } from '../utils/auth';
import { 
  GraduationCap, 
  BookOpen, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Mail, 
  Phone, 
  School, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (session: UserSession) => void;
  onClose?: () => void;
  initialMode?: 'login' | 'register';
  forced?: boolean; // if true, user must login/register before continuing
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  initialMode = 'login',
  forced = false
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Common / Register form state
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [className, setClassName] = useState('');
  const [phone, setPhone] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setEmail('');
    setClassName('');
    setPhone('');
    setFormError(null);
    setFieldErrors({});
    setSuccessMessage(null);
  };

  const handleSwitchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setFormError(null);
    setFieldErrors({});
    setSuccessMessage(null);
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      const res = await loginAccount(username, password);
      if (res.success && res.data) {
        setSuccessMessage('Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => {
          onSuccess(res.data!);
        }, 300);
      } else {
        setFormError(res.error || 'Đăng nhập không thành công');
      }
    } catch (err) {
      setFormError('Đã xảy ra lỗi trong quá trình đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      const res = await registerAccount({
        username,
        role,
        fullName,
        password,
        confirmPassword,
        email,
        className: role === 'STUDENT' ? className : undefined,
        phone
      });

      if (res.success && res.data) {
        setSuccessMessage('Đăng ký tài khoản thành công! Tự động đăng nhập...');
        setTimeout(() => {
          onSuccess(res.data!);
        }, 500);
      } else {
        setFormError(res.error || 'Đăng ký tài khoản không thành công');
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    } catch (err) {
      setFormError('Đã xảy ra lỗi trong quá trình tạo tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Logins
  const handleQuickDemoLogin = async (demoUsername: string) => {
    setIsLoading(true);
    setFormError(null);
    try {
      const res = await loginAccount(demoUsername, 'EduChem@2025');
      if (res.success && res.data) {
        onSuccess(res.data);
      } else {
        setFormError(res.error || 'Không thể đăng nhập tài khoản demo');
      }
    } catch {
      setFormError('Lỗi đăng nhập tài khoản mẫu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EduChem Studio · Xác thực người dùng</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {mode === 'login' ? 'Đăng nhập hệ thống' : 'Đăng ký tài khoản mới'}
          </h2>
          <p className="text-xs text-slate-500">
            {mode === 'login'
              ? 'Chọn tài khoản để vào thi online, quản lý ngân hàng câu hỏi hoặc tạo đề'
              : 'Khai báo vai trò Giáo viên hoặc Học sinh để bắt đầu sử dụng'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => handleSwitchMode('login')}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('register')}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đăng ký tài khoản
          </button>
        </div>

        {/* Global Error Alert */}
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {/* ===================== MODE: LOGIN ===================== */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đăng nhập <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
                    required
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Đang xử lý...' : 'Đăng nhập vào hệ thống'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Demo Login Option */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-400 text-center mb-2.5">
                  HOẶC TRẢI NGHIỆM NHANH VỚI TÀI KHOẢN MẪU:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('giaovien')}
                    className="p-2.5 text-xs text-left bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-bold text-indigo-950 text-[11px]">Giáo viên demo</div>
                      <div className="text-[10px] text-indigo-600 font-mono">giaovien</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('hocsinh')}
                    className="p-2.5 text-xs text-left bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-emerald-950 text-[11px]">Học sinh demo</div>
                      <div className="text-[10px] text-emerald-600 font-mono">hocsinh</div>
                    </div>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ===================== MODE: REGISTER ===================== */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Role Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  1. Chọn vai trò của bạn <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('STUDENT')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      role === 'STUDENT'
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 text-emerald-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        role === 'STUDENT'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Học sinh (HS)</div>
                      <div className="text-[10px] text-slate-500">Thi online & xem điểm</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('TEACHER')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      role === 'TEACHER'
                        ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 text-indigo-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        role === 'TEACHER'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Giáo viên (GV)</div>
                      <div className="text-[10px] text-slate-500">Tạo đề, ngân hàng & quản lý</div>
                    </div>
                  </button>
                </div>
                {fieldErrors.role && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{fieldErrors.role}</p>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Tên đăng nhập (Username) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ví dụ: vanan_11a1 hoặc gv_nguyenvan"
                    required
                    className={`w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium ${
                      fieldErrors.username ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                </div>
                {fieldErrors.username && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">
                    {fieldErrors.username}
                  </p>
                )}
              </div>

              {/* Dynamic Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. {role === 'STUDENT' ? 'Họ và tên học sinh' : 'Họ và tên giáo viên'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={
                    role === 'STUDENT' ? 'Ví dụ: Nguyễn Văn An' : 'Ví dụ: Thầy Trần Quang Hưng'
                  }
                  required
                  className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium ${
                    fieldErrors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {fieldErrors.fullName && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    4. Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ít nhất 8 ký tự"
                      required
                      className={`w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium ${
                        fieldErrors.password ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    5. Nhập lại mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Khớp với mật khẩu trên"
                      required
                      className={`w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium ${
                        fieldErrors.confirmPassword
                          ? 'border-rose-400 bg-rose-50/30'
                          : 'border-slate-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Optional Fields Group */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Thông tin bổ sung (Không bắt buộc)
                </div>

                {/* Class name (emphasized for students) */}
                {role === 'STUDENT' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                      <span>Lớp / Khối học</span>
                      <span className="text-[10px] text-slate-400">Không bắt buộc</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <School className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        placeholder="Ví dụ: 11 Chuyên Hóa, 11A1, 12 Tin..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                      <span>Email</span>
                      <span className="text-[10px] text-slate-400">Không bắt buộc</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ten@example.com"
                        className={`w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium ${
                          fieldErrors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="text-[10px] text-rose-600 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                      <span>Số điện thoại</span>
                      <span className="text-[10px] text-slate-400">Không bắt buộc</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0912345678"
                        className={`w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium ${
                          fieldErrors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    {fieldErrors.phone && (
                      <p className="text-[10px] text-rose-600 mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Security notice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Mật khẩu được mã hóa băm mật mã SHA-256 kèm chuỗi Salt ngẫu nhiên bằng Web Crypto API trước khi lưu trữ cục bộ, tuyệt đối không lưu văn bản thuần.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Đang tạo tài khoản...' : 'Lưu thông tin & Đăng ký'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer switch or close button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-2">
          {mode === 'login' ? (
            <p>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                className="font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                Đăng ký ngay
              </button>
            </p>
          ) : (
            <p>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className="font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                Đăng nhập
              </button>
            </p>
          )}

          {!forced && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
