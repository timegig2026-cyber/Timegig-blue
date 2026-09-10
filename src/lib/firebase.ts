import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, updateDoc, doc, serverTimestamp, setDoc, getDoc, where, limit, getDocs, orderBy, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBpR2SyQnfBxjXRmpmKQaqhzVCoy2gs2Cg",
  authDomain: "gen-lang-client-0530555722.firebaseapp.com",
  projectId: "gen-lang-client-0530555722",
  storageBucket: "gen-lang-client-0530555722.firebasestorage.app",
  messagingSenderId: "518497463646",
  appId: "1:518497463646:web:69dc16a1c7606b396833cf"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Use the custom database ID if specified in firebase-applet-config.json
export const db = getFirestore(app, "ai-studio-gigsouthafrica-f6c36726-8075-49e9-85e2-ec3d17d7cee7");

export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { signInWithPopup, signOut, onAuthStateChanged, collection, addDoc, query, onSnapshot, updateDoc, doc, serverTimestamp, setDoc, getDoc, where, limit, getDocs, orderBy, deleteDoc, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile };
export type { User };
