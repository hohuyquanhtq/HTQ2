import { UserAccount, UserSession, UserRole } from '../types';

const STORAGE_KEYS = {
  USERS: 'educhem_user_accounts_v1',
  ACTIVE_SESSION: 'educhem_active_session_v1'
};

/**
 * Computes SHA-256 hash using Web Crypto API.
 * Never exposes or stores plain-text passwords.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}:educhem_crypto_v1`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a random cryptographic hex salt.
 */
export function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate email format if provided
 */
export function isValidEmail(email: string): boolean {
  if (!email || !email.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate Vietnamese phone number format if provided (e.g. 0912345678, 038..., +84...)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || !phone.trim()) return true;
  const clean = phone.replace(/[\s.-]/g, '');
  return /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(clean);
}

/**
 * Loads all registered accounts from local storage.
 */
export function loadUserAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Lỗi khi đọc danh sách tài khoản:', err);
    return [];
  }
}

/**
 * Saves all user accounts to local storage.
 */
export function saveUserAccounts(users: UserAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Lỗi khi lưu danh sách tài khoản:', err);
  }
}

/**
 * Initializes default demo accounts if no accounts exist yet
 */
export async function ensureDefaultAccounts(): Promise<void> {
  const users = loadUserAccounts();
  if (users.length > 0) return;

  const teacherSalt = generateSalt();
  const teacherHash = await hashPassword('EduChem@2025', teacherSalt);

  const studentSalt = generateSalt();
  const studentHash = await hashPassword('EduChem@2025', studentSalt);

  const initialUsers: UserAccount[] = [
    {
      id: 'usr_gv_demo_01',
      username: 'giaovien',
      role: 'TEACHER',
      fullName: 'Thầy Nguyễn Văn A (GV Chuyên)',
      email: 'giaovien@educhem.edu.vn',
      phone: '0987654321',
      passwordHash: teacherHash,
      salt: teacherSalt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'usr_hs_demo_01',
      username: 'hocsinh',
      role: 'STUDENT',
      fullName: 'Nguyễn Văn An',
      className: '11 Chuyên Hóa',
      email: 'vanan@educhem.edu.vn',
      phone: '0912345678',
      passwordHash: studentHash,
      salt: studentSalt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  saveUserAccounts(initialUsers);
}

/**
 * Retrieves the currently active session from local storage.
 */
export function getCurrentSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Lỗi khi đọc phiên đăng nhập:', err);
    return null;
  }
}

/**
 * Saves the active session to local storage.
 */
export function saveCurrentSession(session: UserSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
  } catch (err) {
    console.error('Lỗi khi lưu phiên đăng nhập:', err);
  }
}

/**
 * Clears current session on logout.
 */
export function clearCurrentSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  } catch (err) {
    console.error('Lỗi khi xóa phiên đăng nhập:', err);
  }
}

export interface RegisterParams {
  username: string;
  role: UserRole;
  fullName: string;
  password: string;
  confirmPassword: string;
  email?: string;
  className?: string;
  phone?: string;
}

export interface AuthResult<T = void> {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  data?: T;
}

/**
 * Registers a new user account with strict validations.
 */
export async function registerAccount(params: RegisterParams): Promise<AuthResult<UserSession>> {
  const fieldErrors: Record<string, string> = {};

  // Clean inputs
  const username = params.username.trim().toLowerCase();
  const fullName = params.fullName.trim();
  const password = params.password;
  const confirmPassword = params.confirmPassword;
  const email = params.email?.trim() || '';
  const className = params.className?.trim() || '';
  const phone = params.phone?.trim() || '';

  // 1. Role
  if (params.role !== 'TEACHER' && params.role !== 'STUDENT') {
    fieldErrors.role = 'Vui lòng chọn vai trò Giáo viên hoặc Học sinh';
  }

  // 2. Username
  if (!username) {
    fieldErrors.username = 'Tên đăng nhập là bắt buộc';
  } else if (username.length < 3) {
    fieldErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
  } else if (!/^[a-z0-9_.-]+$/.test(username)) {
    fieldErrors.username = 'Tên đăng nhập chỉ gồm chữ cái, số, dấu gạch dưới hoặc chấm';
  }

  // 3. Full name
  if (!fullName) {
    fieldErrors.fullName =
      params.role === 'STUDENT'
        ? 'Họ và tên học sinh là bắt buộc'
        : 'Họ và tên giáo viên là bắt buộc';
  }

  // 4. Password & confirmation
  if (!password) {
    fieldErrors.password = 'Mật khẩu là bắt buộc';
  } else if (password.length < 8) {
    fieldErrors.password = 'Mật khẩu phải có tối thiểu 8 ký tự';
  }

  if (!confirmPassword) {
    fieldErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu';
  } else if (password !== confirmPassword) {
    fieldErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
  }

  // 5. Optional Email
  if (email && !isValidEmail(email)) {
    fieldErrors.email = 'Định dạng email không hợp lệ (ví dụ: name@example.com)';
  }

  // 6. Optional Phone
  if (phone && !isValidPhone(phone)) {
    fieldErrors.phone = 'Số điện thoại Việt Nam không hợp lệ (gồm 10 số, ví dụ 0912345678)';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors, error: 'Vui lòng kiểm tra lại thông tin khai báo' };
  }

  // Check unique username
  const existingUsers = loadUserAccounts();
  const duplicate = existingUsers.find((u) => u.username.toLowerCase() === username);
  if (duplicate) {
    fieldErrors.username = `Tên đăng nhập "${username}" đã tồn tại. Vui lòng chọn tên khác.`;
    return { success: false, fieldErrors, error: 'Tên đăng nhập đã tồn tại' };
  }

  // Hash password with cryptographically random salt
  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  const newUser: UserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    username,
    role: params.role,
    fullName,
    email: email || undefined,
    className: className || undefined,
    phone: phone || undefined,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedUsers = [newUser, ...existingUsers];
  saveUserAccounts(updatedUsers);

  // Automatically create and store session
  const session: UserSession = {
    userId: newUser.id,
    username: newUser.username,
    role: newUser.role,
    fullName: newUser.fullName,
    email: newUser.email,
    className: newUser.className,
    phone: newUser.phone,
    loggedInAt: new Date().toISOString()
  };
  saveCurrentSession(session);

  return { success: true, data: session };
}

/**
 * Authenticates user credentials.
 */
export async function loginAccount(usernameInput: string, passwordInput: string): Promise<AuthResult<UserSession>> {
  const username = usernameInput.trim().toLowerCase();
  const password = passwordInput;

  if (!username) {
    return { success: false, error: 'Vui lòng nhập tên đăng nhập' };
  }
  if (!password) {
    return { success: false, error: 'Vui lòng nhập mật khẩu' };
  }

  // Make sure default demo accounts exist
  await ensureDefaultAccounts();

  const users = loadUserAccounts();
  const user = users.find((u) => u.username.toLowerCase() === username);

  if (!user) {
    return {
      success: false,
      error: 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.'
    };
  }

  // Hash input with user's salt and compare
  const computedHash = await hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    return {
      success: false,
      error: 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.'
    };
  }

  const session: UserSession = {
    userId: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    className: user.className,
    phone: user.phone,
    loggedInAt: new Date().toISOString()
  };

  saveCurrentSession(session);
  return { success: true, data: session };
}

/**
 * Updates profile details (Full name, email, class, phone)
 */
export function updateUserProfile(
  userId: string,
  updates: { fullName: string; email?: string; className?: string; phone?: string }
): AuthResult<UserSession> {
  const users = loadUserAccounts();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    return { success: false, error: 'Không tìm thấy tài khoản người dùng' };
  }

  if (!updates.fullName.trim()) {
    return { success: false, error: 'Họ và tên không được để trống' };
  }

  if (updates.email && !isValidEmail(updates.email)) {
    return { success: false, error: 'Định dạng email không hợp lệ' };
  }

  if (updates.phone && !isValidPhone(updates.phone)) {
    return { success: false, error: 'Số điện thoại Việt Nam không hợp lệ' };
  }

  const user = users[idx];
  user.fullName = updates.fullName.trim();
  user.email = updates.email?.trim() || undefined;
  user.className = updates.className?.trim() || undefined;
  user.phone = updates.phone?.trim() || undefined;
  user.updatedAt = new Date().toISOString();

  users[idx] = user;
  saveUserAccounts(users);

  const updatedSession: UserSession = {
    userId: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    className: user.className,
    phone: user.phone,
    loggedInAt: new Date().toISOString()
  };
  saveCurrentSession(updatedSession);

  return { success: true, data: updatedSession };
}

/**
 * Changes password with current password verification
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string
): Promise<AuthResult<void>> {
  const users = loadUserAccounts();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    return { success: false, error: 'Không tìm thấy tài khoản người dùng' };
  }

  const user = users[idx];

  // Verify current password
  const currentHash = await hashPassword(currentPassword, user.salt);
  if (currentHash !== user.passwordHash) {
    return { success: false, error: 'Mật khẩu hiện tại không chính xác' };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Mật khẩu mới phải có ít nhất 8 ký tự' };
  }

  if (newPassword !== confirmNewPassword) {
    return { success: false, error: 'Xác nhận mật khẩu mới không khớp' };
  }

  // Create new salt and hash
  const newSalt = generateSalt();
  const newHash = await hashPassword(newPassword, newSalt);

  user.salt = newSalt;
  user.passwordHash = newHash;
  user.updatedAt = new Date().toISOString();

  users[idx] = user;
  saveUserAccounts(users);

  return { success: true };
}
