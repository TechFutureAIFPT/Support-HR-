import React, { useCallback, useEffect, useState } from 'react';
import {
  linkGoogleAfterPasswordSignIn,
  mapFirebaseError,
  sendResetPassword,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '@/lib/services/auth/authService';
import type { AuthUser } from '@/lib/services/auth/authTypes';

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
    status: 'Đã kết nối workspace tuyển dụng của đội ngũ',
  },
  {
    icon: 'fa-solid fa-ranking-star',
    title: 'Bảng xếp hạng shortlist',
    status: 'Điểm phù hợp được cập nhật theo thời gian thực',
  },
  {
    icon: 'fa-solid fa-shield-halved',
    title: 'Phiên truy cập bảo mật',
    status: 'Mã hóa xác thực nhiều lớp cho recruiter hiện đại',
  },
];

const PASSWORD_HINTS = [
  '>> Gõ mật khẩu để xác thực phiên làm việc',
  '>> Truy cập không gian tuyển dụng an toàn',
  '>> Hệ thống đang chờ khóa truy cập của bạn',
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
    <span className="absolute left-0 top-0 h-5 w-5 border-l border-t border-[#f5d6bb]/80" />
    <span className="absolute right-0 top-0 h-5 w-5 border-r border-t border-[#f5d6bb]/80" />
    <span className="absolute left-0 bottom-0 h-5 w-5 border-b border-l border-[#f5d6bb]/80" />
    <span className="absolute right-0 bottom-0 h-5 w-5 border-b border-r border-[#f5d6bb]/80" />
  </>
);

const inputBaseClass =
  'w-full border border-white/10 bg-black/70 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all placeholder:text-slate-600 focus:border-cyan-400/35 focus:bg-black';

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
    if (onClose) {
      onClose();
      return;
    }

    window.location.href = '/';
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
      className={`login-page-shell relative min-h-screen overflow-hidden bg-black text-slate-100 transition-all duration-700 ${
        successStage === 'transitioning' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.08),transparent_24%)]" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        <section
          className={`hidden border-r border-white/8 px-8 py-8 lg:flex lg:flex-col lg:justify-between xl:px-10 xl:py-9 transition-all duration-700 ${
            loaded ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0'
          }`}
        >
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-3 border border-[#f5d6bb]/20 bg-white/[0.03] px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-[#f5d6bb]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f5d6bb]/80 animate-pulse" />
              SYSTEM_STATUS: ONLINE
            </div>

            <div className="mt-9">
              <h1 className="max-w-md text-4xl font-black uppercase leading-[0.92] tracking-[-0.04em] text-white xl:text-5xl">
                Mở khóa
                <br />
                <span className="text-cyan-300">tuyển dụng AI</span>
              </h1>

              <div className="mt-7 border-l border-[#f5d6bb]/70 pl-5">
                <p className="max-w-sm text-lg leading-8 text-slate-300">
                  Truy cập không gian sàng lọc của Support HR để đối sánh CV, chuẩn hóa JD và
                  ra quyết định tuyển dụng nhanh hơn trong một hệ thống thống nhất.
                </p>
              </div>
            </div>
          </div>

          <div className="grid max-w-xl gap-3">
            {systemSignals.map((signal) => (
              <div
                key={signal.title}
                className="flex items-start gap-4 border border-white/8 bg-white/[0.035] px-4 py-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/10 bg-black/80 text-slate-100">
                  <i className={`${signal.icon} text-base`} />
                </div>
                <div>
                  <p className="text-lg font-bold uppercase tracking-[-0.02em] text-white">
                    {signal.title}
                  </p>
                  <p className="mt-1 font-mono text-sm leading-6 text-[#f5d6bb]">{signal.status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          className={`flex flex-col px-5 py-5 sm:px-7 lg:px-10 transition-all duration-700 ${
            loaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackHome}
              className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.24em] text-[#f5d6bb] transition-colors hover:text-white"
            >
              <i className="fa-solid fa-arrow-left text-[11px]" />
              TRỞ_VỀ_TRANG_CHỦ
            </button>

            <div className="inline-flex items-center gap-3 lg:hidden">
              <div className="h-10 w-10 overflow-hidden border border-white/10 bg-black/70">
                <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Support HR</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
                  Access Layer
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center py-6">
            <div className="w-full max-w-lg">
              <div className="relative border border-white/10 bg-white/[0.04] px-5 py-6 sm:px-8 sm:py-7">
                <CornerFrame />

                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-[#f5d6bb]/60 bg-[#f5d6bb]/5 text-[#f5d6bb]">
                  <div className="flex h-10 w-10 items-center justify-center border border-[#f5d6bb]/25 bg-black/65">
                    <i className="fa-solid fa-user-shield text-lg" />
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-white sm:text-[2rem]">
                    {showReset ? 'Khôi phục truy cập' : 'Access Control'}
                  </h2>
                  <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.22em] text-[#f5d6bb]">
                    {showReset ? '>> PASSWORD_RECOVERY_REQUIRED' : '>> AUTHENTICATION_REQUIRED'}
                  </p>
                </div>

                {showSuccess && (
                  <div
                    className={`mt-6 border px-4 py-3 transition-all duration-500 ${
                      successStage === 'celebrating'
                        ? 'border-emerald-400/35 bg-emerald-400/10 opacity-100'
                        : 'opacity-0'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center border border-emerald-400/35 bg-emerald-400/10 text-emerald-300">
                        <i className="fa-solid fa-check text-sm" />
                      </div>
                      <span className="font-mono text-sm text-emerald-200">
                        {tab === 'signup' ? 'Đăng ký thành công' : 'Xác thực thành công'}
                      </span>
                    </div>
                  </div>
                )}

                {authError && (
                  <div className="mt-6 border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-200">
                    {authError}
                  </div>
                )}

                {!showReset && (
                  <div className="mt-5 flex border border-white/10 bg-black/60 p-1">
                    {(['signin', 'signup'] as AuthTab[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => switchTab(mode)}
                        className={`flex-1 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] transition-all ${
                          tab === mode
                            ? 'bg-white text-black'
                            : 'text-slate-500 hover:text-slate-200'
                        }`}
                      >
                        {mode === 'signin' ? 'Đăng nhập' : 'Đăng ký'}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  {showReset ? (
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div>
                        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
                          EMAIL_TRUY_CẬP
                        </label>
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => {
                            setResetEmail(e.target.value);
                            setErrors((prev) => ({ ...prev, email: undefined }));
                            setAuthError('');
                          }}
                          placeholder="you@example.com"
                          className={`${inputBaseClass} ${
                            errors.email ? 'border-red-500/40' : ''
                          }`}
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                      </div>

                      <div className="border border-white/8 bg-black/65 px-4 py-3 text-[13px] leading-6 text-slate-400">
                        Nhập email đã đăng ký. Support HR sẽ gửi liên kết đặt lại mật khẩu để bạn
                        khôi phục quyền truy cập phiên làm việc.
                      </div>

                      {resetSent && (
                        <div className="border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-[13px] text-emerald-200">
                          Đã gửi liên kết đến <strong>{resetEmail}</strong>. Kiểm tra hộp thư và
                          làm theo hướng dẫn trong email.
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full border border-white bg-white px-4 py-3 text-[13px] font-black uppercase tracking-[0.14em] text-black transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? 'ĐANG_GỬI_LIÊN_KẾT' : 'GỬI_LIÊN_KẾT'}
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
                        className="w-full font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500 transition-colors hover:text-slate-200"
                      >
                        ← QUAY_LẠI_ĐĂNG_NHẬP
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                      {tab === 'signup' && (
                        <div>
                          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
                            HỌ_TÊN
                          </label>
                          <input
                            type="text"
                            value={form.displayName}
                            onChange={(e) => setField('displayName', e.target.value)}
                            placeholder="Nhập tên của bạn"
                            className={`${inputBaseClass} ${
                              errors.displayName ? 'border-red-500/40' : ''
                            }`}
                          />
                          {errors.displayName && (
                            <p className="mt-1 text-xs text-red-400">{errors.displayName}</p>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
                          EMAIL_TRUY_CẬP
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setField('email', e.target.value)}
                          placeholder="you@example.com"
                          className={`${inputBaseClass} ${
                            errors.email ? 'border-red-500/40' : ''
                          }`}
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-end justify-between gap-3">
                          <label className="block font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
                            MẬT_KHẨU
                          </label>
                          <div className="min-h-[14px] font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-300/85">
                            {typedHint}
                            <span className="ml-1 inline-block h-3 w-px bg-cyan-300 align-middle animate-pulse" />
                          </div>
                        </div>

                        <div className="relative">
                          <input
                            type={passwordVisible ? 'text' : 'password'}
                            value={form.password}
                            onChange={(e) => setField('password', e.target.value)}
                            placeholder={tab === 'signup' ? 'Ít nhất 6 ký tự' : 'Nhập mật khẩu'}
                            className={`${inputBaseClass} pr-16 ${
                              errors.password ? 'border-red-500/40' : ''
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setPasswordVisible((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-slate-200"
                          >
                            {passwordVisible ? 'HIDE' : 'SHOW'}
                          </button>
                        </div>

                        {errors.password && (
                          <p className="mt-1 text-xs text-red-400">{errors.password}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full border border-white bg-white px-4 py-3 text-[13px] font-black uppercase tracking-[0.14em] text-black transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading
                          ? tab === 'signup'
                            ? 'ĐANG_TẠO_TÀI_KHOẢN'
                            : 'ĐANG_XÁC_THỰC'
                          : tab === 'signup'
                            ? 'TẠO_TÀI_KHOẢN'
                            : 'ĐĂNG_NHẬP'}
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
                          className="w-full font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500 transition-colors hover:text-slate-200"
                        >
                          QUÊN_MẬT_KHẨU?
                        </button>
                      )}
                    </form>
                  )}
                </div>

                {!showReset && (
                  <>
                    <div className="my-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-white/8" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-600">
                        OR
                      </span>
                      <div className="h-px flex-1 bg-white/8" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-3 border border-white/10 bg-black/65 px-4 py-3 text-[13px] font-bold uppercase tracking-[0.12em] text-white transition-all hover:border-white/20 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
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

                <div className="mt-6 border-t border-white/8 pt-5 text-center">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    Khi truy cập, bạn đồng ý với
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-300">
                    <a href="/terms" className="transition-colors hover:text-white">
                      Điều khoản dịch vụ
                    </a>
                    <span className="text-slate-600">&amp;</span>
                    <a href="/privacy-policy" className="transition-colors hover:text-white">
                      Chính sách bảo mật
                    </a>
                  </div>
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
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setLinkModal((prev) => ({ ...prev, open: false }))}
          />

          <div className="relative w-full max-w-md border border-white/10 bg-[#090909] px-6 py-8 text-slate-100 shadow-2xl shadow-black/60">
            <CornerFrame />

            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-[#f5d6bb]/60 bg-[#f5d6bb]/5 text-[#f5d6bb]">
              <i className="fa-solid fa-link text-lg" />
            </div>

            <h3 className="text-center text-3xl font-black uppercase tracking-[-0.04em] text-white">
              Liên kết tài khoản
            </h3>
            <p className="mt-4 text-center text-sm leading-7 text-slate-400">
              Email <span className="text-cyan-300">{linkModal.email}</span> đã tồn tại bằng mật
              khẩu. Xác thực lại để gộp với đăng nhập Google trong cùng một phiên.
            </p>

            <form onSubmit={handleLinkAccount} className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-slate-400">
                  MẬT_KHẨU_HIỆN_TẠI
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
                    className={`${inputBaseClass} pr-20 ${
                      linkModal.error ? 'border-red-500/40' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setLinkPasswordVisible((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500 transition-colors hover:text-slate-200"
                  >
                    {linkPasswordVisible ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                {linkModal.error && <p className="mt-1 text-xs text-red-400">{linkModal.error}</p>}
              </div>

              <button
                type="submit"
                disabled={linkModal.loading}
                className="w-full border border-white bg-white px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {linkModal.loading ? 'ĐANG_LIÊN_KẾT' : 'XÁC_NHẬN_VÀ_LIÊN_KẾT'}
              </button>

              <button
                type="button"
                onClick={() => setLinkModal((prev) => ({ ...prev, open: false }))}
                className="w-full font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500 transition-colors hover:text-slate-200"
              >
                HỦY
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
