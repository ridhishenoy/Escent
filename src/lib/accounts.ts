import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, signInWithPopup, signOut } from './firebase';

const RESERVED_USERNAMES = new Set(['auth', 'login', 'signup', 'logout', 'setup', 'journal', 'feed', 'people', 'find']);

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string): string {
  const normalized = normalizeUsername(username);

  if (!normalized) {
    throw new AuthError('Choose a username.');
  }

  if (normalized.length < 3 || normalized.length > 30) {
    throw new AuthError('Username must be 3–30 characters.');
  }

  if (!/^[a-z0-9_]+$/.test(normalized)) {
    throw new AuthError('Use letters, numbers, and underscores only.');
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    throw new AuthError('That username is reserved. Try another.');
  }

  return normalized;
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  try {
    const claimDoc = await getDoc(doc(db, 'usernames', normalized));
    return claimDoc.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `usernames/${normalized}`);
  }
}

export async function listUsernames(): Promise<string[]> {
  try {
    const snapshot = await getDocs(collection(db, 'usernames'));
    return snapshot.docs.map((docSnap) => docSnap.id);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'usernames');
  }
}

export function generateCandidateUsername(name?: string | null, email?: string | null): string {
  let base = '';
  if (name) {
    base = name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  }
  if (!base && email) {
    base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  }
  if (base.length < 3) {
    base = 'user_' + Math.floor(1000 + Math.random() * 9000);
  }
  if (base.length > 20) {
    base = base.slice(0, 20);
  }
  return base;
}

export async function signInWithGoogle(): Promise<{ username: string; isNewUser: boolean }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userProfileRef = doc(db, 'profiles', user.uid);
    const profileSnap = await getDoc(userProfileRef);

    if (profileSnap.exists()) {
      const data = profileSnap.data();
      return { username: data.username, isNewUser: false };
    }

    // New user: claim a unique username
    let candidate = generateCandidateUsername(user.displayName, user.email);
    let isTaken = await isUsernameTaken(candidate);
    let attempts = 0;
    while (isTaken && attempts < 10) {
      attempts++;
      const suffix = Math.floor(100 + Math.random() * 900);
      candidate = `${candidate.slice(0, 16)}_${suffix}`;
      isTaken = await isUsernameTaken(candidate);
    }

    // Reserve username claim
    await setDoc(doc(db, 'usernames', candidate), {
      username: candidate,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    });

    // Create profile
    await setDoc(userProfileRef, {
      id: user.uid,
      username: candidate,
      displayName: user.displayName || candidate,
      avatarUrl: user.photoURL || null,
      email: user.email || null,
      isPrivate: false,
      createdAt: new Date().toISOString(),
    });

    return { username: candidate, isNewUser: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes('auth/popup-closed-by-user')) {
      throw new AuthError('Sign-in cancelled.');
    }
    handleFirestoreError(error, OperationType.WRITE, 'profiles');
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
