import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

export type RequestStatus = 'pending' | 'accepted' | 'declined';

export type FollowRequest = {
  id: string;
  from: string;
  to: string;
  status: RequestStatus;
  createdAt: string;
};

export type FollowRelation = 'self' | 'none' | 'pending_out' | 'pending_in' | 'following';

export async function getProfileId(username: string): Promise<string | null> {
  try {
    const q = query(collection(db, 'profiles'), where('username', '==', username));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].id;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'profiles');
  }
}

export async function findPair(fromUsername: string, toUsername: string): Promise<FollowRequest | undefined> {
  try {
    const q = query(
      collection(db, 'follows'),
      where('followerUsername', '==', fromUsername),
      where('followingUsername', '==', toUsername)
    );
    const snap = await getDocs(q);
    if (snap.empty) return undefined;

    const data = snap.docs[0].data();
    return {
      id: snap.docs[0].id,
      from: data.followerUsername,
      to: data.followingUsername,
      status: data.status as RequestStatus,
      createdAt: data.createdAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'follows');
  }
}

export async function getFollowRelation(viewer: string, target: string): Promise<FollowRelation> {
  if (viewer === target) return 'self';

  const outgoing = await findPair(viewer, target);
  if (outgoing?.status === 'accepted') return 'following';
  if (outgoing?.status === 'pending') return 'pending_out';

  const incoming = await findPair(target, viewer);
  if (incoming?.status === 'pending') return 'pending_in';

  return 'none';
}

export async function getFollowing(username: string): Promise<string[]> {
  try {
    const q = query(
      collection(db, 'follows'),
      where('followerUsername', '==', username),
      where('status', '==', 'accepted')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data().followingUsername).filter(Boolean);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'follows');
  }
}

export async function getIncomingRequests(username: string): Promise<FollowRequest[]> {
  try {
    const q = query(
      collection(db, 'follows'),
      where('followingUsername', '==', username),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        from: data.followerUsername,
        to: username,
        status: data.status as RequestStatus,
        createdAt: data.createdAt,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'follows');
  }
}

export async function sendFollowRequest(
  fromUsername: string,
  toUsername: string,
  autoAccept = false
): Promise<void> {
  if (fromUsername === toUsername) throw new Error('You already have you.');
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const followerId = user.uid;
  const followingId = await getProfileId(toUsername);
  if (!followingId) throw new Error('User not found.');

  try {
    const targetSnap = await getDoc(doc(db, 'profiles', followingId));
    const isTargetPrivate = targetSnap.exists() ? Boolean(targetSnap.data()?.isPrivate) : false;
    const isAuto = autoAccept || !isTargetPrivate;

    const existing = await findPair(fromUsername, toUsername);
    if (existing) {
      if (existing.status !== (isAuto ? 'accepted' : 'pending')) {
        await updateDoc(doc(db, 'follows', existing.id), {
          status: isAuto ? 'accepted' : 'pending',
        });
      }
      return;
    }

    const followRef = doc(collection(db, 'follows'));
    await setDoc(followRef, {
      id: followRef.id,
      followerId,
      followerUsername: fromUsername,
      followingId,
      followingUsername: toUsername,
      status: isAuto ? 'accepted' : 'pending',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'follows');
  }
}

export async function cancelFollowRequest(fromUsername: string, toUsername: string): Promise<void> {
  const existing = await findPair(fromUsername, toUsername);
  if (!existing || existing.status === 'accepted') return;
  try {
    await deleteDoc(doc(db, 'follows', existing.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `follows/${existing.id}`);
  }
}

export async function unfollow(fromUsername: string, toUsername: string): Promise<void> {
  const existing = await findPair(fromUsername, toUsername);
  if (!existing) return;
  try {
    await deleteDoc(doc(db, 'follows', existing.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `follows/${existing.id}`);
  }
}

export async function acceptFollowRequest(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'follows', id), { status: 'accepted' });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `follows/${id}`);
  }
}

export async function declineFollowRequest(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'follows', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `follows/${id}`);
  }
}
