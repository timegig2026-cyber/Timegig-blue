import { useState, useEffect } from 'react';
import { 
  auth, 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  googleProvider, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  db,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from '../lib/firebase';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Listen to the user's Firestore profile
        const profileRef = doc(db, 'profiles', currentUser.uid);
        profileUnsub = onSnapshot(profileRef, (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.warn("Error listening to user profile:", err);
          setLoading(false);
        });
      } else {
        if (profileUnsub) {
          profileUnsub();
          profileUnsub = null;
        }
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(result.user, { displayName: name });
      return result.user;
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  /**
   * Disables or enables the user's account.
   * If `enable` is provided as boolean, sets to that state.
   * Otherwise toggles current state.
   * Also updates user's gigs with ownerDisabled status.
   */
  const toggleAccountStatus = async (enable?: boolean) => {
    if (!user) return false;
    const currentDisabled = !!profile?.isDisabled;
    const nextDisabled = enable !== undefined ? !enable : !currentDisabled;

    try {
      const profileRef = doc(db, 'profiles', user.uid);
      await setDoc(profileRef, {
        isDisabled: nextDisabled,
        isOnline: !nextDisabled,
        disabledAt: nextDisabled ? serverTimestamp() : null
      }, { merge: true });

      // Synchronously update gigs created by this user
      try {
        const userGigsQuery = query(collection(db, 'gigs'), where('ownerId', '==', user.uid));
        const userGigsSnap = await getDocs(userGigsQuery);
        const updates = userGigsSnap.docs.map(gDoc => 
          updateDoc(doc(db, 'gigs', gDoc.id), { ownerDisabled: nextDisabled })
        );
        await Promise.all(updates);
      } catch (gigErr) {
        console.warn("Could not cascade disabled status to gigs:", gigErr);
      }

      return !nextDisabled; // true if active/enabled, false if disabled
    } catch (error) {
      console.error("Failed to toggle account status:", error);
      throw error;
    }
  };

  const isAccountDisabled = !!profile?.isDisabled;

  return { 
    user, 
    profile, 
    isAccountDisabled, 
    loading, 
    login, 
    logout, 
    loginWithEmail, 
    registerWithEmail,
    toggleAccountStatus 
  };
}

