import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  linkWithPopup,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  type User as FirebaseUser,
  type AuthCredential,
} from 'firebase/auth';
import { auth } from '@/services/firebase';
import { UserProfileService } from '@/services/data-sync/userProfileService';
import { googleDriveService } from '@/services/file-processing/googleDriveService';
import type { AuthUser, SignUpData, SignInData, AuthCallback } from '@/services/auth/authTypes';

function toAuthUser(user: FirebaseUser, provider?: 'google' | 'email'): AuthUser {
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || undefined,
    photoURL: user.photoURL,
    provider: provider ?? 'email',
    createdAt: user.metadata.creationTime
      ? new Date(user.metadata.creationTime).getTime()
      : Date.now(),
  };
}

function mapFirebaseError(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.',
    'auth/invalid-email': 'Định dạng email không hợp lệ.',
    'auth/weak-password': 'Mật khẩu phải có ít nhất 6 ký tự.',
    'auth/wrong-password': 'Mật khẩu không đúng.',
    'auth/user-not-found': 'Tài khoản không tồn tại. Hãy đăng ký trước.',
    'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa.',
    'auth/too-many-requests': 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
    'auth/popup-closed-by-user': 'Đã hủy đăng nhập Google.',
    'auth/network-request-failed': 'Lỗi mạng. Kiểm tra kết nối và thử lại.',
    'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
    'auth/operation-not-allowed': 'Đăng nhập bằng email chưa được bật. Liên hệ hỗ trợ.',
    'auth/account-exists-with-different-credential': 'Email này đã được đăng ký theo cách khác. Đang liên kết tài khoản...',
    'auth/credential-already-in-use': 'Tài khoản Google này đã được liên kết với một tài khoản khác.',
    'auth/provider-already-linked': 'Tài khoản Google đã được liên kết rồi.',
    'auth/requires-recent-login': 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại để tiếp tục.',
  };
  return map[code] || 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

async function ensureUserProfile(
  user: FirebaseUser,
  provider: 'google' | 'email',
  displayName?: string,
): Promise<void> {
  await UserProfileService.saveUserProfile(
    user.uid,
    user.email || '',
    displayName || user.displayName || user.email?.split('@')[0] || '',
    user.photoURL || undefined
  );
}

async function syncUserProfileSafely(
  user: FirebaseUser,
  provider: 'google' | 'email',
  displayName?: string,
): Promise<void> {
  try {
    await ensureUserProfile(user, provider, displayName);
  } catch (error) {
    console.warn('User profile sync failed after successful auth:', error);
  }
}

function queueUserProfileSync(
  user: FirebaseUser,
  provider: 'google' | 'email',
  displayName?: string,
): void {
  void syncUserProfileSafely(user, provider, displayName);
}

let _googleAccessToken: string | null = null;

export function getGoogleAccessToken(): string | null {
  return _googleAccessToken;
}

function extractGoogleAccessToken(source: unknown): string | null {
  if (!source || typeof source !== 'object') return null;
  const accessToken = (source as { accessToken?: unknown }).accessToken;
  return typeof accessToken === 'string' && accessToken.trim() ? accessToken.trim() : null;
}

function bootstrapGoogleDriveSession(accessToken: string | null): void {
  _googleAccessToken = accessToken;
  if (!accessToken) return;

  void googleDriveService.connectWithGoogleSession(accessToken, {
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  }).catch((error) => {
    console.warn('Google Drive session bootstrap failed after sign-in:', error);
  });
}

export function onAuthChange(callback: AuthCallback): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }
    const isGoogle = !!user.providerData[0]?.providerId?.includes('google');
    const provider: 'google' | 'email' = isGoogle ? 'google' : 'email';
    callback(toAuthUser(user, provider));
  });
}

export async function signUpWithEmail(data: SignUpData): Promise<AuthUser> {
  const result = await createUserWithEmailAndPassword(auth, data.email, data.password);

  if (data.displayName) {
    await updateProfile(result.user, { displayName: data.displayName });
  }

  queueUserProfileSync(result.user, 'email', data.displayName);
  return toAuthUser(result.user, 'email');
}

export async function signInWithEmail(data: SignInData): Promise<AuthUser> {
  const result = await signInWithEmailAndPassword(auth, data.email, data.password);
  queueUserProfileSync(result.user, 'email');
  return toAuthUser(result.user, 'email');
}

export async function signInWithGoogle(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.readonly');
  provider.addScope('https://www.googleapis.com/auth/gmail.send');

  try {
    const result = await signInWithPopup(auth, provider);
    bootstrapGoogleDriveSession(extractGoogleAccessToken(GoogleAuthProvider.credentialFromResult(result)));
    queueUserProfileSync(result.user, 'google');
    return toAuthUser(result.user, 'google');
  } catch (err: any) {
    if (err.code === 'auth/account-exists-with-different-credential') {
      const email: string = err.customData?.email ?? '';
      const pendingCred: AuthCredential = GoogleAuthProvider.credentialFromError(err)!;
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.includes('password')) {
        const error = new Error('LINK_REQUIRED') as any;
        error.code = 'auth/link-required';
        error.email = email;
        error.pendingCred = pendingCred;
        throw error;
      }
    }
    throw err;
  }
}

export async function linkGoogleAfterPasswordSignIn(
  email: string,
  password: string,
  pendingCred: AuthCredential,
): Promise<AuthUser> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await linkWithCredential(result.user, pendingCred);
  bootstrapGoogleDriveSession(extractGoogleAccessToken(pendingCred));
  queueUserProfileSync(result.user, 'google');
  return toAuthUser(result.user, 'google');
}

export async function linkGoogleAccount(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.readonly');
  provider.addScope('https://www.googleapis.com/auth/gmail.send');
  const result = await linkWithPopup(auth.currentUser!, provider);
  bootstrapGoogleDriveSession(extractGoogleAccessToken(GoogleAuthProvider.credentialFromResult(result)));
  queueUserProfileSync(result.user, 'google');
  return toAuthUser(result.user, 'google');
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function sendResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export { mapFirebaseError };
