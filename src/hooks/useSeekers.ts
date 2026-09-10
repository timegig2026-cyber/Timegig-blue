import { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, where, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, HireRequest } from '../types';

const MOCK_SEEKERS: Partial<UserProfile>[] = [
  { firstName: 'Thabo', surname: 'Mbeki', province: 'Gauteng', isOnline: true, status: 'reviewed' },
  { firstName: 'Lerato', surname: 'Khumalo', province: 'Western Cape', isOnline: true, status: 'reviewed' },
  { firstName: 'Sipho', surname: 'Zuma', province: 'KwaZulu-Natal', isOnline: true, status: 'reviewed' },
  { firstName: 'Zanele', surname: 'Dlamini', province: 'Gauteng', isOnline: true, status: 'reviewed' },
  { firstName: 'Mandla', surname: 'Mandela', province: 'Eastern Cape', isOnline: true, status: 'reviewed' }
];

export function useSeekers() {
  const [seekers, setSeekers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We no longer attempt to seed profiles from the client to avoid permission errors.
    // Profiles should be created by users themselves during the onboarding/profile flow.
    
    const q = query(
      collection(db, 'profiles'),
      where('isOnline', '==', true),
      where('status', '==', 'reviewed')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let seekersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];

      // If no real seekers exist, we can show mock data in the UI without saving to DB
      if (seekersData.length === 0) {
        seekersData = MOCK_SEEKERS.map((s, i) => ({
          id: `mock-${i}`,
          ...s,
          certificates: [],
          dob: '1990-01-01',
          updatedAt: new Date()
        })) as UserProfile[];
      }

      setSeekers(seekersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching seekers:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const initiateHire = async (seekerId: string, hirerId: string) => {
    try {
      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + 60000); // 60 seconds

      const hireRef = await addDoc(collection(db, 'hire_requests'), {
        seekerId,
        hirerId,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: expiresAt
      });

      return hireRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'hire_requests');
      return null;
    }
  };

  return { seekers, loading, initiateHire };
}
