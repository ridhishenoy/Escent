import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

export type UserProfile = {
  username: string;
  displayName: string;
  avatarDataUrl: string | null;
  email?: string | null;
  isPrivate?: boolean;
};

export type Subject = {
  id: string;
  name: string;
  color: string;
};

export type PostSection = {
  id: string;
  question: string;
  answer: string;
  askedBy: string | null;
  isHelpful?: boolean;
};

export type PostComment = {
  id: string;
  authorUsername: string;
  body: string;
  createdAt: string;
  parentId?: string | null;
};

export type JournalPost = {
  id: string;
  subjectId: string;
  title: string;
  keyTakeaway?: string | null;
  studyMinutes?: number | null;
  isPinned?: boolean;
  sections: PostSection[];
  comments: PostComment[];
  imageDataUrl: string | null;
  imageUrls: string[];
  savedFrom?: string | null;
  createdAt: string;
};

export type Journal = {
  subjects: Subject[];
  posts: JournalPost[];
};

export const SUBJECT_COLORS = [
  '#ec4899',
  '#db2777',
  '#f472b6',
  '#fb7185',
  '#c084fc',
  '#f43f5e',
  '#e11d48',
  '#9d174d',
];

export function createEntryId(): string {
  return crypto.randomUUID();
}

export async function getProfile(username: string): Promise<UserProfile> {
  try {
    const q = query(collection(db, 'profiles'), where('username', '==', username));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return {
        username: data.username,
        displayName: data.displayName || data.username,
        avatarDataUrl: data.avatarUrl || null,
        email: data.email || null,
        isPrivate: Boolean(data.isPrivate),
      };
    }
    return {
      username,
      displayName: username,
      avatarDataUrl: null,
      isPrivate: false,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'profiles');
  }
}

export async function listProfiles(): Promise<UserProfile[]> {
  try {
    const snapshot = await getDocs(collection(db, 'profiles'));
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        username: data.username,
        displayName: data.displayName || data.username,
        avatarDataUrl: data.avatarUrl || null,
        email: data.email || null,
        isPrivate: Boolean(data.isPrivate),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'profiles');
  }
}

export async function listJournalOwners(): Promise<string[]> {
  try {
    const snapshot = await getDocs(collection(db, 'posts'));
    const owners = new Set<string>();
    snapshot.docs.forEach((d) => {
      const uname = d.data().username;
      if (uname) owners.add(uname);
    });
    return Array.from(owners);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'posts');
  }
}

export async function listDiscoverablePeople(exclude?: string): Promise<UserProfile[]> {
  const profiles = await listProfiles();
  const filtered = exclude ? profiles.filter((p) => p.username !== exclude) : profiles;
  return filtered.sort((left, right) => left.displayName.localeCompare(right.displayName));
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    const userDocRef = doc(db, 'profiles', user.uid);
    await updateDoc(userDocRef, {
      displayName: profile.displayName,
      avatarUrl: profile.avatarDataUrl,
      isPrivate: Boolean(profile.isPrivate),
    });
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `profiles/${user.uid}`);
  }
}

export async function getJournal(username: string): Promise<Journal> {
  try {
    // 1. Fetch subjects
    const subjectsQuery = query(collection(db, 'subjects'), where('username', '==', username));
    const subjectsSnap = await getDocs(subjectsQuery);
    const subjects: Subject[] = subjectsSnap.docs.map((d) => ({
      id: d.id,
      name: d.data().name,
      color: d.data().color,
    }));

    // 2. Fetch posts
    const postsQuery = query(collection(db, 'posts'), where('username', '==', username));
    const postsSnap = await getDocs(postsQuery);

    if (postsSnap.empty) {
      return { subjects, posts: [] };
    }

    const posts: JournalPost[] = await Promise.all(
      postsSnap.docs.map(async (postDoc) => {
        const postData = postDoc.data();
        const commentsSnap = await getDocs(
          query(collection(db, 'posts', postDoc.id, 'comments'), orderBy('createdAt', 'asc'))
        );

        const comments: PostComment[] = commentsSnap.docs.map((cDoc) => {
          const cData = cDoc.data();
          return {
            id: cDoc.id,
            authorUsername: cData.authorUsername,
            body: cData.body,
            createdAt: cData.createdAt,
            parentId: cData.parentId || null,
          };
        });

        return {
          id: postDoc.id,
          subjectId: postData.subjectId,
          title: postData.title,
          keyTakeaway: postData.keyTakeaway || null,
          studyMinutes: postData.studyMinutes || null,
          isPinned: Boolean(postData.isPinned),
          imageDataUrl: postData.imageDataUrl || null,
          imageUrls: postData.imageUrls || (postData.imageDataUrl ? [postData.imageDataUrl] : []),
          createdAt: postData.createdAt,
          sections: postData.sections || [],
          savedFrom: postData.savedFrom || null,
          comments,
        };
      })
    );

    // Sort: pinned posts first, then descending by creation
    posts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

    return { subjects, posts };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'posts');
  }
}

export async function addSubject(username: string, name: string, color: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Give the subject a name.');
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    const existingQ = query(
      collection(db, 'subjects'),
      where('username', '==', username),
      where('name', '==', trimmed)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) throw new Error('You already have that subject.');

    const newSubRef = doc(collection(db, 'subjects'));
    await setDoc(newSubRef, {
      id: newSubRef.id,
      userId: user.uid,
      username,
      name: trimmed,
      color,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already have that subject')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, 'subjects');
  }
}

export async function removeSubject(_username: string, subjectId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'subjects', subjectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `subjects/${subjectId}`);
  }
}

export async function addPost(
  username: string,
  post: Omit<JournalPost, 'id' | 'createdAt' | 'comments'>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const sections = post.sections
    .map((section) => ({
      ...section,
      question: section.question.trim(),
      answer: section.answer.trim(),
      askedBy: section.askedBy ?? null,
    }))
    .filter((section) => section.question || section.answer);

  if (
    !post.title.trim() &&
    sections.length === 0 &&
    !post.imageDataUrl &&
    (!post.imageUrls || post.imageUrls.length === 0)
  ) {
    throw new Error('Add a title, a question, or an image.');
  }

  try {
    const postRef = doc(collection(db, 'posts'));
    await setDoc(postRef, {
      id: postRef.id,
      userId: user.uid,
      username,
      subjectId: post.subjectId,
      title: post.title.trim(),
      keyTakeaway: post.keyTakeaway ? post.keyTakeaway.trim() : null,
      studyMinutes: post.studyMinutes ? Number(post.studyMinutes) : null,
      isPinned: Boolean(post.isPinned),
      imageDataUrl: post.imageDataUrl || null,
      imageUrls: post.imageUrls || (post.imageDataUrl ? [post.imageDataUrl] : []),
      sections,
      savedFrom: post.savedFrom || null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'posts');
  }
}

export async function togglePinPost(_ownerUsername: string, postId: string, isPinned: boolean): Promise<void> {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { isPinned });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
  }
}

export async function toggleHelpfulAnswer(_ownerUsername: string, postId: string, sectionId: string): Promise<void> {
  try {
    const postRef = doc(db, 'posts', postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) return;
    const sections: PostSection[] = (snap.data().sections || []).map((s: PostSection) => {
      if (s.id === sectionId) {
        return { ...s, isHelpful: !s.isHelpful };
      }
      return s;
    });
    await updateDoc(postRef, { sections });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
  }
}

export type LearningStats = {
  streakDays: number;
  totalStudyMinutes: number;
  totalQuestionsAnswered: number;
  totalPosts: number;
  activityDates: Record<string, number>; // YYYY-MM-DD -> count
};

export function calculateLearningStats(posts: JournalPost[]): LearningStats {
  const activityDates: Record<string, number> = {};
  let totalStudyMinutes = 0;
  let totalQuestionsAnswered = 0;

  posts.forEach((post) => {
    const dateStr = post.createdAt.split('T')[0];
    activityDates[dateStr] = (activityDates[dateStr] || 0) + 1;

    if (post.studyMinutes) {
      totalStudyMinutes += Number(post.studyMinutes);
    }

    if (post.sections) {
      post.sections.forEach((s) => {
        if (s.answer && s.answer.trim()) {
          totalQuestionsAnswered += 1;
        }
      });
    }
  });

  // Calculate current streak
  let streakDays = 0;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const checkDate = new Date(today);
  // Check if posted today, or start from yesterday
  const postedToday = Boolean(activityDates[todayStr]);
  if (!postedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (activityDates[dStr]) {
      streakDays += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    streakDays,
    totalStudyMinutes,
    totalQuestionsAnswered,
    totalPosts: posts.length,
    activityDates,
  };
}

export async function savePostToCollection(
  viewerUsername: string,
  targetSubjectId: string,
  sourcePost: JournalPost,
  sourceOwnerUsername?: string
): Promise<void> {
  await addPost(viewerUsername, {
    subjectId: targetSubjectId,
    title: sourcePost.title,
    sections: sourcePost.sections,
    imageDataUrl: sourcePost.imageDataUrl,
    imageUrls: sourcePost.imageUrls,
    savedFrom: sourceOwnerUsername || null,
  });
}

export async function removePost(_username: string, postId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
  }
}

export async function addQuestionToPost(
  _ownerUsername: string,
  postId: string,
  askedBy: string,
  question: string
): Promise<void> {
  const trimmed = question.trim();
  if (!trimmed) throw new Error('Write a question first.');

  try {
    const postDocRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postDocRef);
    if (!postSnap.exists()) throw new Error('Post not found.');

    const data = postSnap.data();
    const sections: PostSection[] = data.sections || [];
    sections.push({
      id: crypto.randomUUID(),
      question: trimmed,
      answer: '',
      askedBy,
    });

    await updateDoc(postDocRef, { sections });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
  }
}

export async function answerPostQuestion(
  _ownerUsername: string,
  postId: string,
  sectionId: string,
  answer: string
): Promise<void> {
  const trimmed = answer.trim();
  if (!trimmed) throw new Error('Write an answer first.');

  try {
    const postDocRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postDocRef);
    if (!postSnap.exists()) throw new Error('Post not found.');

    const data = postSnap.data();
    const sections: PostSection[] = (data.sections || []).map((s: PostSection) => {
      if (s.id === sectionId) {
        return { ...s, answer: trimmed };
      }
      return s;
    });

    await updateDoc(postDocRef, { sections });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
  }
}

export async function addCommentToPost(
  _ownerUsername: string,
  postId: string,
  authorUsername: string,
  body: string,
  parentId?: string | null
): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error('Write a comment first.');
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    const commentRef = doc(collection(db, 'posts', postId, 'comments'));
    await setDoc(commentRef, {
      id: commentRef.id,
      postId,
      authorId: user.uid,
      authorUsername,
      body: trimmed,
      parentId: parentId || null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `posts/${postId}/comments`);
  }
}

export async function removePostComment(
  _ownerUsername: string,
  postId: string,
  commentId: string,
  _requester: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `posts/${postId}/comments/${commentId}`);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read that image.'));
    image.src = src;
  });
}

export async function fileToCompressedDataUrl(file: File, maxEdge: number): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose an image file.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not process that image.');
    }
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
