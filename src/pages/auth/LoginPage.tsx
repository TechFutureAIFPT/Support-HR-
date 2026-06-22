import React, { useCallback, useEffect, useState } from 'react';
import {
  linkGoogleAfterPasswordSignIn,
  mapFirebaseError,
  sendResetPassword,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '@/services/auth/authService';
import type { AuthUser } from '@/services/auth/authTypes';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
  onClose?: () => void;
}

type AuthTab = 'signin' | 'signup';

interface FormState {
  email: string;
  password: string;
  displayName: string;
}

const systemSignals = [
  {
    icon: 'fa-solid fa-brain',
    title: 'Đối sánh ứng viên bằng AI',
    status: 'Đang xử lý hồ sơ theo ngữ cảnh tuyển dụng',
  },
  {
    icon: 'fa-solid fa-database',
    title: 'Kho dữ liệu CV tập trung',
    status: 'Đã kết nối không gian tuyển dụng của đội ngũ',
  },
  {
    icon: 'fa-solid fa-ranking-star',
    title: 'Bảng xếp hạng danh sách đề cử',
    status: 'Điểm phù hợp được cập nhật theo thời gian thực',
  },
  {
    icon: 'fa-solid fa-shield-halved',
    title: 'Phiên truy cập bảo mật',
    status: 'Mã hóa xác thực nhiều lớp cho nhà tuyển dụng hiện đại',
  },
];

const PASSWORD_HINTS = [
  'Mã hóa đầu cuối, an toàn tuyệt đối',
  'Phiên làm việc bảo mật nhiều lớp',
  'Xác thực nhanh, không lưu mật khẩu',
];

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Vui lòng nhập email.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ.';
  return null;
}

function validatePassword(password: string, minLen = 6): string | null {
  if (!password) return 'Vui lòng nhập mật khẩu.';
  if (password.length < minLen) return `Mật khẩu phải có ít nhất ${minLen} ký tự.`;
  return null;
}

const CornerFrame = () => (
  <>
    <span className="absolute left-0 top-0 h-5 w-5 border-l border-t border-blue-200" />
    <span className="absolute right-0 top-0 h-5 w-5 border-r border-t border-blue-200" />
    <span className="absolute left-0 bottom-0 h-5 w-5 border-b border-l border-blue-200" />
    <span className="absolute right-0 bottom-0 h-5 w-5 border-b border-r border-blue-200" />
  </>
);

const inputBaseClass =
  'w-full rounded-xl border border-blue-100 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-blue-300 focus:bg-white';

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onClose }) => {
  const [tab, setTab] = useState<AuthTab>('signin');
  const [form, setForm] = useState<FormState>({ email: '', password: '', displayName: '' });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successStage, setSuccessStage] = useState<'idle' | 'celebrating' | 'transitioning'>('idle');
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [linkPasswordVisible, setLinkPasswordVisible] = useState(false);
  const [typedHint, setTypedHint] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [linkModal, setLinkModal] = useState<{
    open: boolean;
    email: string;
    password: string;
    pendingCred: unknown;
    error: string;
    loading: boolean;
  }>({
    open: false,
    email: '',
    password: '',
    pendingCred: null,
    error: '',
    loading: false,
  });

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    const currentHint = PASSWORD_HINTS[hintIndex];
    let charIndex = 0;
    let rotateTimer: ReturnType<typeof setTimeout> | null = null;

    setTypedHint('');

    const typeTimer = setInterval(() => {
      charIndex += 1;
      setTypedHint(currentHint.slice(0, charIndex));

      if (charIndex >= currentHint.length) {
        clearInterval(typeTimer);
        rotateTimer = setTimeout(() => {
          setHintIndex((prev) => (prev + 1) % PASSWORD_HINTS.length);
        }, 1200);
      }
    }, 28);

    return () => {
      clearInterval(typeTimer);
      if (rotateTimer) clearTimeout(rotateTimer);
    };
  }, [hintIndex]);

  const handleBackHome = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const switchTab = useCallback((nextTab: AuthTab) => {
    setTab(nextTab);
    setShowReset(false);
    setResetSent(false);
    setResetEmail('');
    setForm({ email: '', password: '', displayName: '' });
    setErrors({});
    setAuthError('');
    setPasswordVisible(false);
  }, []);

  const setField = useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setAuthError('');
  }, []);

  const runSuccessAnimation = useCallback((user: AuthUser) => {
    setAuthError('');
    setShowSuccess(true);
    setSuccessStage('celebrating');
    window.setTimeout(() => onLogin(user), 180);
  }, [onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showReset) {
      const emailErr = validateEmail(resetEmail);
      if (emailErr) {
        setErrors({ email: emailErr });
        return;
      }

      setLoading(true);
      setAuthError('');
      try {
        await sendResetPassword(resetEmail);
        setResetSent(true);
      } catch (err: any) {
        setAuthError(mapFirebaseError(err.code));
      } finally {
        setLoading(false);
      }
      return;
    }

    const emailErr = validateEmail(form.email);
    const passwordErr = validatePassword(form.password);
    if (emailErr || passwordErr) {
      setErrors({ email: emailErr || undefined, password: passwordErr || undefined });
      return;
    }

    if (tab === 'signup' && !form.displayName.trim()) {
      setErrors({ displayName: 'Vui lòng nhập họ tên.' });
      return;
    }

    setLoading(true);
    setAuthError('');

    try {
      const user =
        tab === 'signup'
          ? await signUpWithEmail({
              email: form.email,
              password: form.password,
              displayName: form.displayName,
            })
          : await signInWithEmail({ email: form.email, password: form.password });

      runSuccessAnimation(user);
    } catch (err: any) {
      setAuthError(mapFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError('');

    try {
      const user = await signInWithGoogle();
      runSuccessAnimation(user);
    } catch (err: any) {
      if (err.code === 'auth/link-required') {
        setLinkModal({
          open: true,
          email: err.email,
          password: '',
          pendingCred: err.pendingCred,
          error: '',
          loading: false,
        });
      } else {
        setAuthError(mapFirebaseError(err.code));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!linkModal.password) {
      setLinkModal((prev) => ({ ...prev, error: 'Vui lòng nhập mật khẩu.' }));
      return;
    }

    setLinkModal((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const user = await linkGoogleAfterPasswordSignIn(
        linkModal.email,
        linkModal.password,
        linkModal.pendingCred as never,
      );

      setLinkModal({
        open: false,
        email: '',
        password: '',
        pendingCred: null,
        error: '',
        loading: false,
      });

      runSuccessAnimation(user);
    } catch (err: any) {
      setLinkModal((prev) => ({
        ...prev,
        loading: false,
        error: mapFirebaseError(err.code),
      }));
    }
  };

  return (
    <div
      className={`login-page-shell relative min-h-[100svh] overflow-y-auto overflow-x-hidden bg-[#f6f9ff] text-slate-900 transition-all duration-700 ${
        successStage === 'transitioning' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.08),transparent_24%)]" />

      <div className="relative z-10 grid min-h-[100svh] lg:grid-cols-[1.02fr_0.98fr]">
        <section
          className={`relative hidden overflow-hidden px-8 py-5 lg:flex lg:flex-col lg:justify-between xl:px-10 xl:py-6 transition-all duration-700 ${
            loaded ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0'
          }`}
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0c1a3a 100%)' }}
        >
          {/* Subtle grid overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.08) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
          {/* Glow accents */}
          <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />

          <div className="relative max-w-lg">
            <div className="inline-flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Hệ thống · Đang hoạt động
            </div>

            <div className="mt-8">
              <h1 className="max-w-md text-4xl font-black uppercase leading-[0.9] tracking-[-0.03em] text-white xl:text-5xl">
                Tuyển dụng
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">thông minh hơn</span>
              </h1>

              <div className="mt-5 border-l-2 border-cyan-400/60 pl-4">
                <p className="max-w-sm text-[0.94rem] leading-7 text-white">
                  Nền tảng AI hỗ trợ sàng lọc CV, chuẩn hóa JD và ra quyết định tuyển dụng
                  nhanh hơn — trong một không gian làm việc thống nhất.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/20 text-cyan-300"><i className="fa-solid fa-bolt text-xs" /></span>
                <span className="text-sm font-semibold text-white">Phân tích tức thì</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/20 text-cyan-300"><i className="fa-solid fa-shield-halved text-xs" /></span>
                <span className="text-sm font-semibold text-white">Bảo mật dữ liệu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/20 text-cyan-300"><i className="fa-solid fa-ranking-star text-xs" /></span>
                <span className="text-sm font-semibold text-white">Xếp hạng AI</span>
              </div>
            </div>
          </div>

          <div className="relative grid max-w-xl gap-2.5">
            {systemSignals.map((signal) => (
              <div
                key={signal.title}
                className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/5 px-4 py-3 backdrop-blur-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-blue-400">
                  <i className={`${signal.icon} text-sm`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.82rem] font-bold text-white">{signal.title}</p>
                  <p className="mt-0.5 truncate text-[0.75rem] leading-5 text-white/65">{signal.status}</p>
                </div>
                <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/80" />
              </div>
            ))}
          </div>
        </section>

        <section
          className={`flex min-h-[100svh] flex-col px-5 py-4 sm:px-7 lg:min-h-0 lg:px-8 lg:py-4 xl:px-10 transition-all duration-700 ${
            loaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className={`flex items-center ${onClose ? 'justify-between' : 'justify-end'}`}>
            {onClose ? (
              <button
                type="button"
                onClick={handleBackHome}
                className="inline-flex items-center gap-3 text-xs font-medium text-slate-500 transition-colors hover:text-blue-600"
              >
                <i className="fa-solid fa-arrow-left text-[11px]" />
                TRỞ VỀ
              </button>
            ) : null}

            <div className="lg:hidden">
              <div className="h-10 w-10 overflow-hidden rounded-xl border border-blue-100 bg-white">
                <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-start justify-center py-4 sm:items-center sm:py-5 lg:py-2">
            <div className="w-full max-w-lg">
              <div className="relative rounded-2xl border border-blue-100 bg-white shadow-[0_24px_70px_rgba(30,64,175,0.12)] px-5 py-5 sm:px-7 sm:py-5 xl:px-8">
                <CornerFrame />

                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
                  <i className="fa-solid fa-user-shield text-xl text-blue-600" />
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
                    {showReset ? 'Khôi phục mật khẩu' : 'Đăng nhập vào Support HR'}
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-500">
                    {showReset ? 'Nhập email để nhận liên kết đặt lại mật khẩu' : 'Tiếp tục không gian tuyển dụng của bạn'}
                  </p>
                </div>

                {showSuccess && (
                  <div
                    className={`mt-4 rounded-xl border px-4 py-3 transition-all duration-500 ${
                      successStage === 'celebrating'
                        ? 'border-emerald-200 bg-emerald-50 opacity-100'
                        : 'opacity-0'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <i className="fa-solid fa-circle-check text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-700">
                        {tab === 'signup' ? 'Đăng ký thành công!' : 'Xác thực thành công!'}
                      </span>
                    </div>
                  </div>
                )}

                {authError && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <i className="fa-solid fa-circle-exclamation mt-0.5 text-sm text-red-500" />
                    <p className="text-sm text-red-700">{authError}</p>
                  </div>
                )}

                {!showReset && (
                  <div className="mt-5 flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                    {(['signin', 'signup'] as AuthTab[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => switchTab(mode)}
                        className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                          tab === mode
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {mode === 'signin' ? 'Đăng nhập' : 'Đăng ký'}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  {showReset ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                          Email đã đăng ký
                        </label>
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => {
                            setResetEmail(e.target.value);
                            setErrors((prev) => ({ ...prev, email: undefined }));
                            setAuthError('');
                          }}
                          placeholder="you@company.com"
                          className={`${inputBaseClass} ${
                            errors.email ? 'border-red-300' : ''
                          }`}
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                      </div>

                      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-[13px] leading-6 text-slate-600">
                        Nhập email đã đăng ký. Support HR sẽ gửi liên kết đặt lại mật khẩu để bạn
                        khôi phục quyền truy cập.
                      </div>

                      {resetSent && (
                        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px]">
                          <i className="fa-solid fa-circle-check mt-0.5 text-emerald-500" />
                          <p className="text-emerald-700">Đã gửi liên kết đến <strong>{resetEmail}</strong>. Kiểm tra hộp thư.</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? 'Đang gửi liên kết...' : 'Gửi liên kết đặt lại'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowReset(false);
                          setResetSent(false);
                          setResetEmail('');
                          setErrors({});
                          setAuthError('');
                        }}
                        className="w-full text-sm text-slate-500 transition-colors hover:text-blue-600"
                      >
                        ← Quay lại đăng nhập
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {tab === 'signup' && (
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                            Họ và tên
                          </label>
                          <input
                            type="text"
                            value={form.displayName}
                            onChange={(e) => setField('displayName', e.target.value)}
                            placeholder="Nguyễn Văn A"
                            className={`${inputBaseClass} ${
                              errors.displayName ? 'border-red-300' : ''
                            }`}
                          />
                          {errors.displayName && (
                            <p className="mt-1 text-xs text-red-600">{errors.displayName}</p>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                          Email công ty
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setField('email', e.target.value)}
                          placeholder="you@company.com"
                          className={`${inputBaseClass} ${
                            errors.email ? 'border-red-300' : ''
                          }`}
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="block text-xs font-semibold text-slate-700">
                            Mật khẩu
                          </label>
                          <span className="text-[11px] text-blue-500 italic">{typedHint}<span className="ml-0.5 inline-block h-3 w-px bg-blue-400 align-middle animate-pulse" /></span>
                        </div>

                        <div className="relative">
                          <input
                            type={passwordVisible ? 'text' : 'password'}
                            value={form.password}
                            onChange={(e) => setField('password', e.target.value)}
                            placeholder={tab === 'signup' ? 'Ít nhất 6 ký tự' : 'Nhập mật khẩu'}
                            className={`${inputBaseClass} pr-16 ${
                              errors.password ? 'border-red-300' : ''
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setPasswordVisible((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 transition-colors hover:text-blue-600"
                          >
                            {passwordVisible ? 'Ẩn' : 'Hiện'}
                          </button>
                        </div>

                        {errors.password && (
                          <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="mt-1 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading
                          ? tab === 'signup'
                            ? 'Đang tạo tài khoản...'
                            : 'Đang xác thực...'
                          : tab === 'signup'
                            ? 'Tạo tài khoản'
                            : 'Đăng nhập'}
                      </button>

                      {tab === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowReset(true);
                            setErrors({});
                            setAuthError('');
                            setResetSent(false);
                          }}
                          className="w-full text-sm text-slate-500 transition-colors hover:text-blue-600"
                        >
                          Quên mật khẩu?
                        </button>
                      )}
                    </form>
                  )}
                </div>

                {!showReset && (
                  <>
                    <div className="my-4 flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-xs text-slate-400">hoặc</span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-3 rounded-xl border border-blue-100 bg-white px-4 py-3 text-[13px] font-bold uppercase tracking-[0.12em] text-slate-900 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M5.2662 9.76453C6.19879 6.93863 8.85445 4.90909 12 4.90909C13.6909 4.90909 15.2182 5.50909 16.4182 6.49091L19.9091 3C17.7818 1.14545 15.0545 0 12 0C7.27007 0 3.19775 2.6983 1.23999 6.65002L5.2662 9.76453Z"
                        />
                        <path
                          fill="#34A853"
                          d="M16.0407 18.0126C14.9509 18.7163 13.5661 19.0909 12 19.0909C8.86649 19.0909 6.21912 17.0769 5.27698 14.2679L1.23746 17.335C3.19279 21.2936 7.265 24 12 24C14.9328 24 17.7353 22.9574 19.8342 20.9996L16.0407 18.0126Z"
                        />
                        <path
                          fill="#4A90E2"
                          d="M19.8342 20.9996C22.0292 18.9521 23.4545 15.9037 23.4545 12C23.4545 11.2909 23.3455 10.5818 23.1818 9.90909H12V14.4545H18.4364C18.1188 16.0136 17.2663 17.2212 16.0407 18.0126L19.8342 20.9996Z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.27698 14.2679C5.03833 13.5563 4.90909 12.7938 4.90909 12C4.90909 11.2183 5.03444 10.4668 5.2662 9.76453L1.23999 6.65002C0.436587 8.26043 0 10.0754 0 12C0 13.9195 0.444781 15.7302 1.23746 17.335L5.27698 14.2679Z"
                        />
                      </svg>
                      Tiếp tục với Google
                    </button>
                  </>
                )}

                <div className="mt-4 border-t border-slate-100 pt-4 text-center">
                  <p className="text-[12px] text-slate-400">
                    Bằng cách tiếp tục, bạn đồng ý với{' '}
                    <a href="/terms" className="text-blue-600 hover:underline">Điều khoản dịch vụ</a>
                    {' '}và{' '}
                    <a href="/privacy-policy" className="text-blue-600 hover:underline">Chính sách bảo mật</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {linkModal.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/25 backdrop-blur-sm"
            onClick={() => setLinkModal((prev) => ({ ...prev, open: false }))}
          />

          <div className="relative w-full max-w-md rounded-2xl border border-blue-100 bg-white px-6 py-8 text-slate-900 shadow-2xl shadow-blue-900/10">
            <CornerFrame />

            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
              <i className="fa-solid fa-link text-lg text-blue-600" />
            </div>

            <h3 className="text-center text-2xl font-bold text-slate-900">
              Liên kết tài khoản
            </h3>
            <p className="mt-3 text-center text-sm leading-7 text-slate-500">
              Email <span className="font-semibold text-blue-600">{linkModal.email}</span> đã tồn tại với mật
              khẩu. Xác thực lại để gộp với đăng nhập Google.
            </p>

            <form onSubmit={handleLinkAccount} className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    type={linkPasswordVisible ? 'text' : 'password'}
                    autoFocus
                    value={linkModal.password}
                    onChange={(e) =>
                      setLinkModal((prev) => ({
                        ...prev,
                        password: e.target.value,
                        error: '',
                      }))
                    }
                    placeholder="Nhập mật khẩu của bạn"
                    className={`${inputBaseClass} pr-16 ${
                      linkModal.error ? 'border-red-300' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setLinkPasswordVisible((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 transition-colors hover:text-blue-600"
                  >
                    {linkPasswordVisible ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
                {linkModal.error && <p className="mt-1 text-xs text-red-600">{linkModal.error}</p>}
              </div>

              <button
                type="submit"
                disabled={linkModal.loading}
                className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {linkModal.loading ? 'Đang liên kết...' : 'Xác nhận và liên kết'}
              </button>

              <button
                type="button"
                onClick={() => setLinkModal((prev) => ({ ...prev, open: false }))}
                className="w-full text-sm text-slate-500 transition-colors hover:text-blue-600"
              >
                Hủy
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
